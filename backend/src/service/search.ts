export interface SearchResult {
  /**
   * Id of the document found.
   */
  document: string;

  /**
   * Score of the search result.
   */
  score: number;
}

export interface SearchOptions {
  limit: number;
}

export type VectorSearchService = (
  query: number[],
  options: SearchOptions,
) => Promise<SearchResult>;

export type SearchService = (
  query: string,
  options: SearchOptions,
) => Promise<SearchResult>;
