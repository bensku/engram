export type DocumentId = string[];

export interface Document {
  sections: DocumentId;
}

export interface DocumentStoreService {
  get(id: string): Promise<Document>;
  put(id: string, doc: Document): Promise<void>;
}
