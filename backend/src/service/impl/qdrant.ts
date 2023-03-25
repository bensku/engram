import { Fetcher } from 'openapi-typescript-fetch';
import { paths } from '../../../generated/qdrant';
import { SearchOptions, SearchResult } from '../search';

export function qdrantSearch(url: string) {
  const fetcher = Fetcher.for<paths>();
  fetcher.configure({
    baseUrl: url,
  });
  const search = fetcher
    .path('/collections/{collection_name}/points/search')
    .method('post')
    .create({
      consistency: true,
    });
  return async (
    query: number[],
    options: SearchOptions,
  ): Promise<SearchResult[]> => {
    const res = await search({
      collection_name: 'main',
      vector: query,
      limit: options.limit,
    });
    const results = res.data.result;
    if (!results) {
      return []; // We should get HTTP error code on actual error
    }
    return results.map((result) => {
      return {
        document: result.id.toString(),
        score: result.score,
      };
    });
  };
}
