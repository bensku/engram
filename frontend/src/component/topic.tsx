import { Message, MessageForm } from './message';
import { responses } from '../types';
import { getMessages, postMessage } from '../service/topic';
import { useEffect, useState } from 'preact/hooks';

const EMPTY_MSG: responses['BotMessage'] = {
  type: 'bot',
  id: 'foo',
  text: '',
  widgets: [],
};

export const Topic = ({ id }: { id: string }) => {
  const [messages, setMessages] = useState<responses['Message'][]>([]);
  const [last, setLast] = useState<responses['Message']>();

  useEffect(() => {
    void (async () => {
      const res = await getMessages({ topicId: id });
      setMessages(res.data);
    })();
  }, [id]);

  const post = (text: string) => {
    void (async () => {
      const msg = { ...EMPTY_MSG };
      for await (const part of postMessage({
        topicId: id,
        message: text,
      })) {
        if (part.type == 'msg') {
          msg.text += part.data;
          setLast({ ...msg });
        } else if (part.type == 'end') {
          // Don't refer to last, it has not been updated
          setMessages([...messages, msg]);
          setLast(undefined);
          return;
        } // else: should never happen
      }
    })();
  };

  return (
    <div>
      <h1>Topic name</h1>
      {messages.map((msg) => (
        <Message msg={msg} key={msg.id} />
      ))}
      {last && <Message msg={last} />}
      <MessageForm onSubmit={post} />
    </div>
  );
};
