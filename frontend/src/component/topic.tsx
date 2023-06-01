import { Message, MessageForm } from './message';
import { responses } from '../types';
import { createTopic, getMessages, postMessage } from '../service/topic';
import { useEffect, useState } from 'preact/hooks';
import { RoutableProps } from 'preact-router';

export const Topic = ({ id }: { id?: string } & RoutableProps) => {
  // eslint-disable-next-line prefer-const
  let [topicId, setTopicId] = useState(-1);
  const [messages, setMessages] = useState<responses['Message'][]>([]);
  const [last, setLast] = useState<responses['Message']>();

  useEffect(() => {
    if (id !== undefined) {
      void (async () => {
        const topicId = parseInt(id);
        setTopicId(topicId);
        const res = await getMessages({ topicId });
        setMessages(res.data);
      })();
    } else {
      // New topic
      setTopicId(-1);
      setMessages([]);
    }
  }, [id]);

  const post = (text: string) => {
    void (async () => {
      if (topicId == -1) {
        const newTopic = (await createTopic({})).data;
        topicId = newTopic.id;
        setTopicId(newTopic.id);
      }

      // Post user message to server
      const reply = postMessage({
        topicId,
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
