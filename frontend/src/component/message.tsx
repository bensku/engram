import { createRef } from 'preact';
import { useState } from 'preact/hooks';
import ReactTextareaAutosize from 'react-textarea-autosize';
import { responses } from '../types';

export const Message = ({ msg }: { msg: responses['Message'] }) => {
  const icon = msg.type == 'user' ? 'person' : 'robot';
  const sender = msg.type == 'user' ? 'You' : 'AI Assistant';
  const color = msg.type == 'user' ? 'primary-container' : '';
  return (
    <article class={`row top-align round ${color}`}>
      {/* FIXME accessibility */}
      <a>
        <i>{icon}</i>
        <div class="tooltip">{sender}</div>
      </a>
      <div class="max">{msg.text}</div>
      <button class="transparent circle tiny">
        <i>edit</i>
      </button>
      <button class="transparent circle tiny">
        <i>delete</i>
      </button>
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
        class="fixed bottom front large-margin row background bottom-align"
        style={`width: inherit; max-width: inherit; height: ${height}px;`}
      >
        <div
          class="max field textarea border bottom-align"
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
