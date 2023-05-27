import { Message, MessageForm } from './message';
import { responses } from '../types';
import { getMessages, postMessage } from '../service/topic';
import { useEffect, useState } from 'preact/hooks';

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
      // Post user message to server
      const reply = postMessage({
        topicId: id,
        message: { message: text },
      });

      // Stream reply back from server
      // When server is finished, prepare for user reply
      const msg: responses['BotMessage'] = {
        type: 'bot',
        id: -1,
        agent: '',
        text: '',
        time: Date.now(),
      };
      for await (const part of reply) {
        if (part.type == 'start') {
          messages.push({
            type: 'user',
            id: part.replyTo.id,
            text,
            time: part.replyTo.time,
          });
          msg.agent = part.agent;
          msg.time = part.time;
          setMessages([...messages]);
        } else if (part.type == 'msg') {
          msg.text += part.data;
          setLast({ ...msg });
        } else if (part.type == 'end') {
          // Don't refer to last, it has not been updated
          msg.id = part.id;
          setMessages([...messages, msg]);
          setLast(undefined);
          return;
        } // else: should never happen
      }
    })();
  };

  return (
    <>
      <div class="large-padding">
        {messages.map((msg) => (
          <Message msg={msg} key={msg.id} />
        ))}
        {last && <Message msg={last} />}
      </div>
      <MessageForm onSubmit={post} />
    </>
  );
};
