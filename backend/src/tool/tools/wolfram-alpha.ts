import { OptionType } from '../../chat/options';
import { registerTool } from '../core';
import { JSONSchemaType } from 'ajv';

const SCHEMA: JSONSchemaType<{ query: string }> = {
  type: 'object',
  properties: {
    query: { type: 'string', description: 'The query to WolframAlpha' },
  },
  required: ['query'],
  additionalProperties: false,
};

registerTool({
  enableOption: new OptionType('toggle', 'wolfram-alpha', 'Wolfram Alpha'),
  name: 'wolfram_alpha',
  description:
    'WolframAlpha is a tool that understands natural language queries about entities in many scientific fields. It can also perform mathematical calculations, date and unit conversions and formula solving etc.',
  argsSchema: SCHEMA,
  preHandler: (args) => {
    return Promise.resolve({
      callTitle: `Querying WolframAlpha: "${args.query}"...`,
    });
  },
  handler: async (args) => {
    const reply = await callApi(args.query);
    return {
      message: reply,
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
