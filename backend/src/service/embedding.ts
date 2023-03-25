import { SearchService, VectorSearchService } from './search';

export type EmbeddingService = (text: string) => Promise<number[]>;

export function wrapVectorSearch(
  embeddings: EmbeddingService,
  search: VectorSearchService,
): SearchService {
  return async (query, options) => search(await embeddings(query), options);
}
