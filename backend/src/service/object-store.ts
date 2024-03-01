export interface ObjectStore {
  get(objectId: string): Promise<Uint8Array>;
  getUrl(objectId: string): Promise<string>;
  create(data: Uint8Array, mimeType: string): Promise<string>;
  put(objectId: string, data: Uint8Array): Promise<void>;
}
