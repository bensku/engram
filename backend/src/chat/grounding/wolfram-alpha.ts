import { GroundDataSource } from './hook';

const API_URL = 'https://www.wolframalpha.com/api/v1/llm-api';
const APP_ID = process.env.WOLFRAM_ALPHA_APP_ID ?? '';

/**
 * Creates a data source that uses Wolfram Alpha LLM API.
 * @returns A new data source.
 */
export function wolframAlphaDataSource(): GroundDataSource {
  return async (query, kind) => {
    if (kind == 'keyword_query') {
      const result = await callApi(query);
      return { type: 'chunkList', chunks: result ? [result] : [] };
    }
    return { type: 'chunkList', chunks: [] };
  };
}

async function callApi(query: string): Promise<string | null> {
  const response = await fetch(`${API_URL}?appid=${APP_ID}&input=${query}`);
  if (response.status != 200) {
    return null;
  } else {
    return response.text();
  }
}
