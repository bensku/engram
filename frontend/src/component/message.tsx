import { createRef } from 'preact';
import { useState } from 'preact/hooks';
import ReactTextareaAutosize from 'react-textarea-autosize';
import { responses } from '../types';
import { formatDate } from '../utils';

export const Message = ({ msg }: { msg: responses['Message'] }) => {
  const icon = msg.type == 'user' ? 'person' : 'robot';
  const sender = msg.type == 'bot' ? msg.agent : 'you';
  const color = msg.type == 'user' ? 'indigo1' : '';
  return (
    <article class={`large-margin ${color}`}>
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
            <a class="error-text">
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
  };

  const [height, setHeight] = useState(0);

  return (
    <>
      <div class="spacer" style={`height: ${height}px;`} />
      <div
        class="fixed bottom front large-padding row background bottom-align"
        style={`width: inherit; max-width: inherit; height: ${height}px;`}
      >
        <div
          class="max field textarea border bottom-align background"
          style={`width: inherit; max-width: inherit; height: ${height}px;`}
        >
          <ReactTextareaAutosize
            ref={ref}
            minRows={2}
            maxRows={20}
            onHeightChange={setHeight}
          />
          <span class="helper">Your message</span>
        </div>
        <button
          class="min transparent circle"
          onClick={submit}
          style={'left: -60px;'}
        >
          <i>send</i>
          <div class="tooltip">Send message</div>
        </button>
      </div>
    </>
  );
};
