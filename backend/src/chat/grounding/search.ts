import { batchCompletionsForModel } from '../../service/completion';
import { SearchService } from '../../service/search';
import { GroundDataSource, QueryType } from './hook';
import { message } from '../../service/message';

/**
 * Provides grounding data using a search service.
 * @param dataset Dataset. This is given to search service.
 * @param svc The search service.
 * @param minScore Minimum score for included results.
 * @param limit Maximum amount of results.
 * @param queryHook Optional hook for modifying the queries depending on their type.
 * For example, embedding models may require different query format for
 * retrieval and non-retrieval (hyde) queries.
 * @returns Data source.
 */
export function searchDataSource(
  dataset: string,
  svc: SearchService,
  minScore: number,
  limit: number,
  queryHook: (query: string, kind: QueryType) => string = (query) => query,
): GroundDataSource {
  return async (query, kind) => {
    const results = await svc(queryHook(query, kind), { limit });
    return {
      type: 'idList',
      ids: results
        .filter((result) => result.score >= minScore)
        .slice(0, limit)
        .map((result) => [dataset, ...result.id]),
    };
  };
}

/**
 * Creates a data source that just calls another LLM. What could go wrong... ?
 * This is mainly meant for Perplexity's online models.
 * @param model Model id.
 * @returns Data source of dubious quality.
 */
export function anotherLlmSource(model: string): GroundDataSource {
  const completions = batchCompletionsForModel(model);
  return async (query, kind) => {
    if (kind != 'question') {
      return { type: 'chunkList', chunks: [] };
    }
    const prompt = [message('user', query)];
    return {
      type: 'chunkList',
      chunks: [await completions(prompt, { temperature: 0.1, maxTokens: 800 })],
    };
  };
}
