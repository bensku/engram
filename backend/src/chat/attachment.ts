import { FileObjectStore } from '../service/impl/file-store';

const OBJECT_STORE = new FileObjectStore('attachments');

export function getAttachmentUrl(objectId: string) {
  return OBJECT_STORE.getUrl(objectId);
}
