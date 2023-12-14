import {
  CompletionPart,
  CompletionService,
  ModelOptions,
  completionsForModel,
  toolCompletionsForModel,
} from '../completion';

/**
 * Creates a completion service that is an amalgamation of several models.
 * @param chatModel The normal chat completion model.
 * @param toolModel Specialized tool (function) calling model.
 */
export function amalgamCompletions(
  chatModel: string,
  toolModel: string,
): CompletionService {
  const chatSvc = completionsForModel(chatModel);
  const toolSvc = toolCompletionsForModel(toolModel);
  return async function* (context, options) {
    if (context.length > 0 && context[context.length - 1].type == 'tool') {
      // Tool message; don't feed this as user input to reworder or tool models
      // TODO what if LLM wants to call another tool? should this even be supported?
      for await (const part of chatSvc(context, options)) {
        yield part;
      }
    }

    const noTools: ModelOptions = { ...options, enabledTools: undefined };

    let callsFinished = false;
    let chatFinished = false;

    const chatGenerator = chatSvc(context, noTools);
    const pregenParts: CompletionPart[] = [];
    const pregenPromise = (async () => {
      for (;;) {
        const next = await chatGenerator.next();
        if (next.value) {
          pregenParts.push(next.value);
        }
        if (next.done) {
          chatFinished = true;
          break;
        }
        if (callsFinished) {
          break;
        }
      }
    })();

    const calls = await toolSvc(context.slice(1), {
      temperature: 0.001,
      maxTokens: 512,
      enabledTools: options.enabledTools,
    });

    callsFinished = true;
    if (calls.length > 0) {
      // Tool calls needed
      yield { type: 'tool', calls };
      yield { type: 'end' };
    } else {
      // Yield what was pregenerated and generate the rest of the response
      callsFinished = true;
      await pregenPromise; // Wait for pre-generation to finish to avoid a race condition...
      for (const part of pregenParts) {
        yield part;
      }
      if (chatFinished) {
        return; // Pregeneration encountered end part, so we've already yielded full message
      }

      // Generate rest of the message
      for await (const part of chatGenerator) {
        yield part;
      }
    }
  };
}
