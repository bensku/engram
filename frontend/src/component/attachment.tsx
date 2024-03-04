import { components } from '../../generated/engram';
import { ComponentChildren } from 'preact';
import { JSXInternal } from 'preact/src/jsx';
import { pendingAttachments } from '../state';

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
    console.log('event');
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
