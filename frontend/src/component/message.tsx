import { createRef } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import ReactTextareaAutosize from 'react-textarea-autosize';
import { responses } from '../types';
import { formatDate } from '../utils';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import rehypeHighlight from 'rehype-highlight/lib';

export const Message = ({
  msg,
  replaceMsg,
  engines,
  isLastBotMsg,
}: {
  msg: responses['Message'];
  replaceMsg: (id: number, msg: responses['Message'] | null) => void;
  engines: Map<string, responses['Engine']>;
  isLastBotMsg: boolean;
}) => {
  const icon = msg.type == 'user' ? 'person' : 'robot';
  const sender =
    msg.type == 'bot' ? engines.get(msg.agent)?.name ?? 'Unknown Bot' : 'You';
  const color = msg.type == 'user' ? 'indigo1' : '';

  return (
    <article class={`medium-margin ${color}`}>
      <div class="row no-space bolder">
        <i class="no-margin no-padding">{icon}</i>
        <div class="max">
          {sender} at {formatDate(msg.time)}
        </div>
        {isLastBotMsg ? (
          <button class="transparent circle">
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
      <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
        {msg.text}
      </ReactMarkdown>
    </article>
  );
};

export const MessageList = ({
  messages,
  last,
  replaceMessage,
  engines,
}: {
  messages: responses['Message'][];
  last?: responses['Message'];
  replaceMessage: (id: number, msg: responses['Message'] | null) => void;
  engines: Map<string, responses['Engine']>;
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
          engines={engines}
          isLastBotMsg={!last && i == messages.length - 1 && msg.type == 'bot'}
        />
      ))}
      {last && (
        <Message
          msg={last}
          replaceMsg={() => null}
          engines={engines}
          isLastBotMsg={true}
        />
      )}
    </div>
  );
};

export const MessageForm = ({
  onSubmit,
}: {
  onSubmit: (text: string) => void;
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

  return (
    <>
      <div
        class="message-form front large-padding row background"
        style={`height: ${height}px;`}
      >
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
