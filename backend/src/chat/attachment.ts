import { FileObjectStore } from '../service/impl/file-store';
import { FileUpload } from '../service/message';

const OBJECT_STORE = new FileObjectStore('attachments');

export function getAttachmentUrl(objectId: string): Promise<string> {
  return OBJECT_STORE.getUrl(objectId);
}

export function storeUpload(upload: FileUpload): Promise<string> {
  const buf = Buffer.from(upload.data, 'base64');
  return OBJECT_STORE.create(buf, upload.type);
}
