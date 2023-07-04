import { createRef } from 'preact';
import { useState } from 'preact/hooks';
import ReactTextareaAutosize from 'react-textarea-autosize';
import { responses } from '../types';
import { formatDate } from '../utils';

export const Message = ({
  msg,
  replaceMsg,
}: {
  msg: responses['Message'];
  replaceMsg: (id: number, msg: responses['Message'] | null) => void;
}) => {
  const icon = msg.type == 'user' ? 'person' : 'robot';
  const sender = msg.type == 'bot' ? msg.agent : 'you';
  const color = msg.type == 'user' ? 'indigo1' : '';

  return (
    <article class={`medium-margin ${color}`}>
      <div class="row no-space bolder">
        <i class="no-margin no-padding">{icon}</i>
        <div class="max">
          {sender} at {formatDate(msg.time)}
        </div>
        <button class="transparent circle">
          <i>more_vert</i>
          <div class="dropdown no-wrap">
            <a>
              <i>edit</i>
              Edit
            </a>
            <a class="error-text" onClick={() => replaceMsg(msg.id, null)}>
              <i>delete</i>
              Delete
            </a>
          </div>
        </button>
      </div>
      <div>{msg.text}</div>
    </article>
  );
};

export const MessageList = ({
  messages,
  last,
  replaceMessage,
}: {
  messages: responses['Message'][];
  last?: responses['Message'];
  replaceMessage: (id: number, msg: responses['Message'] | null) => void;
}) => {
  return (
    <div class="message-list">
      {messages.map((msg) => (
        <Message msg={msg} key={msg.id} replaceMsg={replaceMessage} />
      ))}
      {last && <Message msg={last} replaceMsg={() => null} />}
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
