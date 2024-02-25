import { SearchService, VectorSearchService } from './search';

export type EmbeddingService = (text: string) => Promise<number[]>;

export function wrapVectorSearch(
  embeddings: EmbeddingService,
  search: VectorSearchService,
  prefix = '',
): SearchService {
  return async (query, options) =>
    search(await embeddings(`${prefix}${query}`), options);
}
