export interface ObjectStore {
  get(objectId: string): Promise<StoredObject>;
  getUrl(objectId: string): Promise<string>;
  create(data: Uint8Array, mimeType: string): Promise<string>;
  put(objectId: string, data: Uint8Array): Promise<void>;
  delete(objectId: string): Promise<void>;
}

export interface StoredObject {
  mimeType: string;
  data: Uint8Array;
}
