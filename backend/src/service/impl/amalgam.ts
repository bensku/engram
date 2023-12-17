import { XmlPromptSource } from '../../tool/prompt/xml';
import {
  CompletionPart,
  CompletionService,
  ModelOptions,
  batchCompletionsForModel,
  completionsForModel,
} from '../completion';
import { Message } from '../message';

/**
 * Creates a completion service that is an amalgamation of several models.
 * @param chatModel The normal chat completion model.
 * @param toolModel Chat model for tool calls.
 */
export function amalgamCompletions(
  chatModel: string,
  toolModel: string,
): CompletionService {
  const chatSvc = completionsForModel(chatModel);
  const toolSvc = batchCompletionsForModel(toolModel);
  return async function* (context, options) {
    if (context.length > 0 && context[context.length - 1].type == 'tool') {
      // Tool message; don't feed this as user input to reworder or tool models
      // TODO what if LLM wants to call another tool? should this even be supported?
      for await (const part of chatSvc(context, options)) {
        yield part;
      }
    }

    const noTools: ModelOptions = { ...options, enabledTools: undefined };
    const lastMsg = context[context.length - 1];

    let callsFinished = false;
    let chatFinished = false;

    const chatGenerator = chatSvc(
      [
        {
          ...context[0],
          text: `${context[0].text ?? ''}
Aside of just talking with me, you can:
${options.enabledTools?.map((tool) => `* ${tool.purpose}`).join('\n') ?? ''}`,
        },
        ...context.slice(1),
      ],
      noTools,
    );
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

    const toolCtx: Message[] = [
      {
        type: 'system',
        id: 0,
        time: Date.now(),
        text: 'You are an AI assistant specialized in using external tools. Based on the conversation presented below, you should decice which (if any) external tool would be appropriate.',
      },
      ...context.slice(1, context.length - 1),
      {
        ...lastMsg,
        text: `${lastMsg.text ?? ''}

END DIALOGUE

It is time to plan how to best respond to user's message above.

${TOOL_PROMPTER.systemPrompt(options.enabledTools ?? [])}

If you don't want to call a tool, reply with "NO_CALL". In any case, justify why did you call or not call the tools!`,
      },
    ];
    const reply = await toolSvc(toolCtx, {
      temperature: 0.1,
      maxTokens: 512,
      enabledTools: options.enabledTools,
    });
    console.log('should_call?', `'${reply}'`);
    const toolParser = TOOL_PROMPTER.newParser();
    toolParser.append(reply.replaceAll('\\', ''));
    const calls = toolParser.parse();
    console.log(calls);

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

const TOOL_PROMPTER = new XmlPromptSource(false);
