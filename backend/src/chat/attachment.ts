import { FileObjectStore } from '../service/impl/file-store';
import { FileUpload, Message } from '../service/message';
import { ALLOWED_ATTACHMENT_TYPES } from '@bensku/engram-shared/src/mime-types';
import { StoredObject } from '../service/object-store';

const OBJECT_STORE = new FileObjectStore('attachments');

export function getAttachmentUrl(objectId: string): Promise<string> {
  return OBJECT_STORE.getUrl(objectId);
}

export function getAttachment(objectId: string): Promise<StoredObject> {
  return OBJECT_STORE.get(objectId);
}

export function storeUpload(upload: FileUpload): Promise<string> {
  if (!ALLOWED_ATTACHMENT_TYPES.has(upload.type)) {
    throw new Error('attachment type not allowed');
  }
  const buf = Buffer.from(upload.data, 'base64');
  return OBJECT_STORE.create(buf, upload.type);
}

export async function deleteMessageAttachments(
  message: Message,
): Promise<void> {
  // Delete all objects associated with message in parallel
  await Promise.all(
    message.parts
      .filter((part) => part.type == 'image')
      .map((part) =>
        part.type == 'image'
          ? OBJECT_STORE.delete(part.objectId)
          : Promise.resolve(),
      ),
  );
}
