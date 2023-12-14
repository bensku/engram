import { OptionType } from '../../chat/options';
import { registerTool } from '../core';
import { JSONSchemaType } from 'ajv';

const SCHEMA: JSONSchemaType<{ queries: string[] }> = {
  type: 'object',
  properties: {
    queries: {
      type: 'array',
      items: {
        type: 'string',
      },
      description:
        'A list of WolframAlpha queries, each of which asks about ONE thing only.',
    },
  },
  required: ['queries'],
  additionalProperties: false,
};

registerTool({
  enableOption: new OptionType('toggle', 'wolfram-alpha', 'Wolfram Alpha'),
  name: 'wolfram_alpha',
  description:
    'Sends one or more queries to WolframAlpha. WolframAlpha is a tool that understands natural language queries entities in chemistry, physics, geography, history, art, astronomy, and more. It can also perform mathematical calculations, date and unit conversions and formula solving etc.',
  result: 'Natural language answers to the queries.',
  argsSchema: SCHEMA,
  preHandler: (args) => {
    return Promise.resolve({
      callTitle: `Querying WolframAlpha: "${args.queries.join(', ')}"...`,
    });
  },
  handler: async (args) => {
    const replies = await Promise.all(
      args.queries.map((query) => callApi(query)),
    );
    return {
      message: replies.join('\n\n'),
    };
  },
});

const API_URL = 'https://www.wolframalpha.com/api/v1/llm-api';
const APP_ID = process.env.WOLFRAM_ALPHA_APP_ID ?? '';

async function callApi(query: string) {
  // TODO error handling?
  const response = await fetch(`${API_URL}?appid=${APP_ID}&input=${query}`);
  return response.text();
}
