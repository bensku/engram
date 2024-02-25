import { DocumentId } from '../document';
import { VectorSearchService } from '../search';
import { QdrantClient } from '@qdrant/js-client-rest';

export function qdrantSearch(
  url: string,
  collection: string,
): VectorSearchService {
  const qdrant = new QdrantClient({ url });

  return async (query, options) => {
    const results = await qdrant.search(collection, {
      vector: query,
      limit: options.limit,
    });
    return results.map((result) => ({
      id: result.payload?.id as DocumentId,
      score: result.score,
    }));
  };
}
