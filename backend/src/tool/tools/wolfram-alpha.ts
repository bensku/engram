import { OptionType } from '../../chat/options';
import { registerTool } from '../core';
import { JSONSchemaType } from 'ajv';
import { askOnlineLlm } from './online-llm';

const SCHEMA: JSONSchemaType<{ query: string }> = {
  type: 'object',
  properties: {
    query: {
      type: 'string',
      description:
        'The query to WolframAlpha. Convert queries to simplified keywords when possible (e.g. convert "who is POTUS" to "president of united states"). If you need to ask multiple things, simple call this tool multiple times!',
    },
  },
  required: ['query'],
  additionalProperties: false,
};

registerTool({
  enableOption: new OptionType('toggle', 'wolfram-alpha', 'Wolfram Alpha'),
  name: 'wolfram_alpha',
  purpose: 'Query scientific details from WolframAlpha',
  description:
    'WolframAlpha is a tool that understands natural language queries about entities in many scientific fields. It can also perform mathematical calculations, date and unit conversions and formula solving etc.',
  result: 'Natural language answer to the query.',
  guidance:
    'Use wolfram_alpha when asked about scientific facts about specific entities (e.g. notable persons, historical events, elements in chemistry and physics)',
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
  if (response.status != 200) {
    // Fall back to web search
    return askOnlineLlm(
      `Answer this search query as if it was a question: ${query}`,
    );
  } else {
    return response.text();
  }
}
