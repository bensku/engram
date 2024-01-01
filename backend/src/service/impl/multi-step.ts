import { JsonPromptSource } from '../../tool/prompt/json';
import {
  CompletionService,
  batchCompletionsForModel,
  completionsForModel,
} from '../completion';
import { Message } from '../message';

/**
 * A multi-step completion service with planning and tool call support.
 * @param class classifyModel Model for classifying how to process the user messages.
 * @param toolModel Model to form tool calls based on the plan.
 * @param chatModel Model for generating the final response based on the plan
 * and (if provided), the tool call results.
 * @param planModel Model to plan what should be the response.
 * @returns
 */
export function multiStepCompletions(
  classifyModel: string,
  toolModel: string,
  chatModel: string,
  planModel?: string,
): CompletionService {
  const classifySvc = batchCompletionsForModel(classifyModel);
  const toolSvc = batchCompletionsForModel(toolModel);
  const chatSvc = completionsForModel(chatModel);
  const planSvc = planModel ? batchCompletionsForModel(planModel) : null;
  // eslint-disable-next-line require-yield
  return async function* (context, options) {
    const chatCtx = context
      .slice(0, context.length - 1)
      .filter((msg) => msg.type != 'tool' && msg.text);
    chatCtx.push(context[context.length - 1]);

    const category = (
      await classifySvc(
        dropContext(
          appendLast(
            context,
            `---
Let's classify the above message. Available categories:
SMALL_TALK: greetings and small talk
QUESTION: questions, information retrieval, etc.
REQUEST: requests to do something
OTHER: everything else

Reply with the category name only!

Category:`,
          ),
        ),
        { temperature: 0.01, maxTokens: 10 },
      )
    )
      .toLowerCase()
      .trim();
    console.log(category);
    if (category == 'small_talk') {
      // Fast path: just chatting!
      for await (const part of chatSvc(chatCtx, options)) {
        yield part;
      }
      return;
    }

    // Slow path: let's see how we can do this

    let useTools: string;

    if (context[context.length - 1].type != 'tool') {
      useTools = await classifySvc(
        dropSystem(
          appendLast(
            context,
            `---
  You have access to external tools to:
  ${options.enabledTools?.map((tool) => `* ${tool.purpose}`).join('\n') ?? ''}
  
  Should any of them by used in this case? Answer with YES or NO only!
  
  Tools needed:`,
          ),
        ),
        { temperature: 0.01, maxTokens: 25 },
      );
    } else {
      // Force system to reply to the previous tool message
      useTools = 'NO';
    }

    if (useTools.toLowerCase().includes('yes')) {
      const callDesc = await toolSvc(
        dropSystem(
          appendLast(
            context,
            `---
${PROMPT_SOURCE.systemPrompt(options.enabledTools ?? [])}`,
          ),
        ),
        { temperature: 0.01, maxTokens: 500 },
      );
      const parser = PROMPT_SOURCE.newParser();
      parser.append(callDesc);
      const calls = parser.parse();
      if (calls.length > 0) {
        yield { type: 'tool', calls };
        yield { type: 'end' };
        return;
      } // else: fall back to planning
    }

    if (!planSvc) {
      // Advanced planning is not enabled, so let's not do that
      for await (const part of chatSvc(chatCtx, options)) {
        yield part;
      }
      return;
    }

    const plan = await planSvc(
      appendLast(
        chatCtx,
        `---
Plan how you should reply to the user's message.

Format your reply like this:
# Plan
<your step-by-step plan as numbered list>

# Response
<the free-form response to be shown to user>`,
      ),
      { temperature: 0.1, maxTokens: 500, stopTokens: ['# Response'] },
    );
    console.log(plan);
    for await (const part of chatSvc(
      appendLast(chatCtx, `---\n${plan}`),
      options,
    )) {
      yield part;
    }
  };
}

function appendLast(context: Message[], text: string) {
  const last = context[context.length - 1];
  return [
    ...context.slice(0, context.length - 1),
    { ...last, text: `${last.text ?? ''}${text}` },
  ];
}

function dropSystem(context: Message[]) {
  return context.slice(1);
}

function dropContext(context: Message[]) {
  return [context[context.length - 1]];
}

const PROMPT_SOURCE = new JsonPromptSource();
