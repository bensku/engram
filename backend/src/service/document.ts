export type DocumentId = string[];

export interface Document {
  id: string;
  sections: string[];
}

export interface DocumentStoreService {
  get(id: string): Promise<Document | null>;
  put(id: string, doc: Document): Promise<void>;
}
