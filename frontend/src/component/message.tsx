import { createRef } from 'preact';
import { responses } from '../types';

export const Message = ({ msg }: { msg: responses['Message'] }) => {
  return <div>{msg.text}</div>;
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

  return (
    <div>
      <textarea ref={ref} />
      <button onClick={submit}>Send</button>
    </div>
  );
};
