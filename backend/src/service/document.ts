export interface Document {
  content: string;

  sourceUrl: string;
  dataset: string;
}

export interface DocumentStoreService {
  get(id: string): Document;
}
