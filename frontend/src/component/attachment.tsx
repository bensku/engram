import { components } from '../../generated/engram';
import { ComponentChildren } from 'preact';
import { JSXInternal } from 'preact/src/jsx';
import { pendingAttachments } from '../state';
import { ALLOWED_ATTACHMENT_TYPES } from '@bensku/engram-shared/src/mime-types';
import { showAlert } from './alert';

export const DropZone = ({
  children,
  handler,
}: {
  children: ComponentChildren;
  handler: (name: string, type: string, data: ArrayBuffer) => void;
}) => {
  // Extract files and pass them to handler
  const handleDrop = async (
    event: JSXInternal.TargetedDragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    if (event.dataTransfer) {
      for (const item of event.dataTransfer.items) {
        if (item.kind == 'file') {
          const file = item.getAsFile();
          if (file) {
            handler(file.name, file.type, await file.arrayBuffer());
          }
        }
      }
    }
  };

  // TODO dragover upload indicator?
  return (
    <div
      class="drop-zone"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => void handleDrop(event)}
    >
      {children}
    </div>
  );
};

export const Attachment = ({
  attachment,
}: {
  attachment: components['schemas']['FileUpload'];
}) => {
  const removeThis = () => {
    // Intentional identity comparison; same file might be attached multiple times
    pendingAttachments.value = pendingAttachments
      .peek()
      .filter((value) => value != attachment);
  };

  return (
    <div class="attachment row">
      <i>image</i>
      <div class="max">{attachment.name}</div>
      <button class="min transparent circle" onClick={() => removeThis()}>
        <i>close</i>
      </button>
    </div>
  );
};

export function addAttachment(
  name: string,
  type: string,
  data: ArrayBuffer,
): void {
  // Check that type is allowed
  if (!ALLOWED_ATTACHMENT_TYPES.has(type)) {
    showAlert(
      'error',
      `Unsupported attachment type. Only images are supported for now.`,
    );
    return;
  }

  // Create binary string - unfortunately, this is how you do Base64 in browser
  const array = new Uint8Array(data);
  let binaryStr = '';
  for (let i = 0; i < array.byteLength; i++) {
    binaryStr += String.fromCharCode(array[i]);
  }

  // Check that we're not sending too large attachments
  const totalSize =
    pendingAttachments.peek().reduce((sum, next) => sum + next.data.length, 0) +
    binaryStr.length;
  if (totalSize > ATTACHMENT_SIZE_LIMIT) {
    showAlert('error', 'The attachments are too large!');
  }

  // Append to pending attachments; trigger re-render of them
  pendingAttachments.value = [
    ...pendingAttachments.peek(),
    { name, type, data: btoa(binaryStr) },
  ];
}

const ATTACHMENT_SIZE_LIMIT = 20 * 1024 * 1024;
