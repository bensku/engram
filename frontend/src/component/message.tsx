import { createRef } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import ReactTextareaAutosize from 'react-textarea-autosize';
import { responses } from '../types';
import { formatDate } from '../utils';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { engineMap, pendingAttachments } from '../state';
import { JSXInternal } from 'preact/src/jsx';
import { Attachment } from './attachment';
import { useHotkeys } from 'react-hotkeys-hook';

export const Message = ({
  msg,
  replaceMsg,
  isLastMsg,
  regenerate,
  finished,
}: {
  msg: responses['Message'];
  replaceMsg: (id: number, msg: responses['Message'] | null) => void;
  isLastMsg: boolean;
  regenerate: () => void;
  finished: boolean;
}) => {
  if (msg.type == 'tool') {
    return (
      <article class={`medium-margin tiny-padding no-round tertiary-container`}>
        <details>
          <summary class="row">
            <div class="max">Used tool: {msg.tool}</div>
            <button
              class="transparent circle"
              onClick={() => replaceMsg(msg.id, null)}
            >
              <i>delete</i>
              <div class="tooltip bottom">Delete</div>
            </button>
          </summary>
          <div>
            <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
              {/* TODO image/other attachment support */}
              {msg?.parts
                .map((part) => (part.type == 'text' ? part.text : ''))
                .join('') ?? ''}
            </ReactMarkdown>
          </div>
        </details>
      </article>
    );
  }

  const icon = msg.type == 'user' ? 'person' : 'robot';
  const sender =
    msg.type == 'bot'
      ? engineMap.value.get(msg.agent)?.name ?? 'Unknown Bot'
      : 'You';
  const color = msg.type == 'user' ? 'indigo1' : '';

  return (
    <article class={`medium-margin no-round ${color}`}>
      <div class="row no-space bolder">
        <i class="no-margin no-padding">{icon}</i>
        <div class="max">
          {sender} at {formatDate(msg.time)}
        </div>
        {isLastMsg && msg.type == 'bot' && finished ? (
          <button class="transparent circle" onClick={regenerate}>
            <i>refresh</i>
            <div class="tooltip bottom">Regenerate</div>
          </button>
        ) : null}
        <button
          class="transparent circle"
          onClick={() => replaceMsg(msg.id, null)}
        >
          <i>delete</i>
          <div class="tooltip bottom">Delete</div>
        </button>
      </div>
      {msg?.parts.map(renderPart)}
    </article>
  );
};

function renderPart(part: responses['Message']['parts'][0]) {
  if (part.type == 'text') {
    // Markdown text as-is
    return (
      <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
        {part.text}
      </ReactMarkdown>
    );
  } else if (part.type == 'image') {
    return (
      <img
        src={`/api/attachment/${part.objectId})`}
        alt="User-submitted image"
      />
    );
  }
}

export const MessageList = ({
  messages,
  last,
  replaceMessage,
  regenerate,
}: {
  messages: responses['Message'][];
  last?: responses['Message'];
  replaceMessage: (id: number, msg: responses['Message'] | null) => void;
  regenerate: () => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // When messages change or page is entered, scroll down to latest message
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, last]);

  return (
    <div class="message-list" ref={containerRef}>
      {messages.map((msg, i) => (
        <Message
          msg={msg}
          key={msg.id}
          replaceMsg={replaceMessage}
          isLastMsg={!last && i == messages.length - 1 && msg.type == 'bot'}
          regenerate={regenerate}
          finished={true}
        />
      ))}
      {last && (
        <Message
          msg={last}
          replaceMsg={() => null}
          isLastMsg={true}
          regenerate={regenerate}
          finished={false}
        />
      )}
    </div>
  );
};

export const MessageForm = ({
  onSubmit,
  uploadHandler,
}: {
  onSubmit: (text: string) => void;
  uploadHandler: (name: string, type: string, data: ArrayBuffer) => void;
}) => {
  const ref = createRef<HTMLTextAreaElement>();

  const submit = () => {
    if (!ref.current) {
      return; // No text to send, do nothing
    }
    onSubmit(ref.current.value);
    ref.current.value = '';
  };

  const [height, setHeight] = useState(0);

  // Submit if enter is pressed without shift
  const handleEnter = (event: KeyboardEvent) => {
    if (event.key == 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  // Autofocus when entering the topic
  useEffect(() => ref.current?.focus(), []);

  // Hotkey for focusing on text
  useHotkeys('ctrl+space', () => {
    ref.current?.focus();
  });

  const processUpload = async (
    event: JSXInternal.TargetedEvent<HTMLInputElement, Event>,
  ) => {
    event.preventDefault();
    const files = event.currentTarget.files;
    if (files) {
      for (const file of files) {
        uploadHandler(file.name, file.type, await file.arrayBuffer());
      }
    }
  };

  return (
    <>
      <div class="pending-attachments">
        {pendingAttachments.value.map((attachment) => (
          <Attachment attachment={attachment} key={attachment.name} />
        ))}
      </div>
      <div
        class="message-form front large-padding row background"
        style={`height: ${height}px;`}
      >
        <button class="min transparent circle">
          <i>attach_file_add</i>
          <input
            type="file"
            multiple
            onChange={(event) => void processUpload(event)}
          />
        </button>
        <div
          class="field textarea border background"
          style={`height: ${height}px;`}
        >
          <ReactTextareaAutosize
            ref={ref}
            minRows={2}
            maxRows={20}
            onHeightChange={setHeight}
            onKeyDown={handleEnter}
          />
        </div>
        <button class="send-message min transparent circle" onClick={submit}>
          <i>send</i>
          <div class="tooltip">Send message</div>
        </button>
      </div>
    </>
  );
};
