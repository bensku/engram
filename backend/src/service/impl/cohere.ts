import { CohereClient } from 'cohere-ai';
import { RerankService } from '../rerank';

export function cohereRerankings(
  apiToken: string,
  model: string,
): RerankService {
  const client = new CohereClient({ token: apiToken });
  return async (docs, query) => {
    const result = await client.rerank({
      documents: docs.map((doc) => ({ text: doc })),
      query,
      model,
      maxChunksPerDoc: 1,
      returnDocuments: false,
    });
    return result.results.map((entry) => docs[entry.index]);
  };
}
