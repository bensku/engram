export type RerankService = (
  documents: string[],
  query: string,
) => Promise<string[]>;
