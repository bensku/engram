import { SearchService } from '../service/search';
import { GroundDataSource } from './grounding';

export function searchDataSource(
  dataset: string,
  svc: SearchService,
  minScore: number,
  limit: number,
): GroundDataSource {
  return async (query) => {
    const results = await svc(query, { limit });
    return results
      .filter((result) => result.score >= minScore)
      .slice(0, limit)
      .map((result) => [dataset, ...result.id]);
  };
}
