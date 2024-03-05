import { randomBytes } from 'crypto';
import { ObjectStore } from '../object-store';
import * as fs from 'fs/promises';

const ID_REGEX = /[0-9a-zA-Z._]*/;

export class FileObjectStore implements ObjectStore {
  constructor(private dataDir: string) {}

  get(objectId: string): Promise<Uint8Array> {
    return fs.readFile(`${this.dataDir}/${toFileName(objectId)}`);
  }

  async getUrl(objectId: string): Promise<string> {
    const data = await this.get(objectId);
    const mimeType = objectId.split('.')[1].replace('_', '/');
    const base64 = Buffer.from(data).toString('base64');
    return `data:${mimeType};base64,${base64}`;
  }

  async create(data: Uint8Array, mimeType: string): Promise<string> {
    const objectId = `${randomBytes(16).toString('hex')}.${mimeType.replace(
      '/',
      '_',
    )}`;
    await this.put(objectId, data);
    return objectId;
  }

  put(objectId: string, data: Uint8Array): Promise<void> {
    return fs.writeFile(`${this.dataDir}/${toFileName(objectId)}`, data);
  }

  delete(objectId: string): Promise<void> {
    return fs.unlink(`${this.dataDir}/${toFileName(objectId)}`);
  }
}

function toFileName(objectId: string) {
  if (!ID_REGEX.test(objectId)) {
    throw new Error(`invalid object id: ${objectId}`);
  }
  return objectId.split('.')[0];
}
