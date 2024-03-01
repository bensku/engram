import { batchCompletionsForModel } from '../../service/completion';
import { OptionType } from '../../chat/options';
import { registerTool } from '../core';
import { JSONSchemaType } from 'ajv';
import { message } from '../../service/message';

const SCHEMA: JSONSchemaType<{ question: string }> = {
  type: 'object',
  properties: {
    question: {
      type: 'string',
      description: 'A question for AI to search answers for.',
    },
  },
  required: ['question'],
  additionalProperties: false,
};

registerTool({
  enableOption: new OptionType('toggle', 'online-search', 'Online search'),
  name: 'online_search',
  purpose: 'Search the web',
  description:
    'Sends a natural language question to an AI with access to a web search engine (like Google).',
  result: 'A natural-language answer to the question.',
  guidance: 'ALWAYS use online_search when asked about news or recent events!',
  argsSchema: SCHEMA,
  preHandler: (args) => {
    return Promise.resolve({
      callTitle: `Searching ${args.question}...`,
    });
  },
  handler: async (args) => {
    const reply = await askOnlineLlm(args.question);
    return {
      message: reply,
    };
  },
});

const llm = batchCompletionsForModel('perplexity:pplx-7b-online');

export async function askOnlineLlm(question: string) {
  return await llm(
    [
      message(
        'system',
        'You are an AI assistant with web search. Use it to produce up-to-date and factual answers to any questions the user might ask. If your searches turn up interesting, related, information, include that in your responses! On the other hand, if you cannot find something, DO NOT rely on your own knowledge - just state that you could not find what the user was looking for.',
      ),
      message('user', question),
    ],
    { temperature: 0.3, maxTokens: 1000 },
  );
}
