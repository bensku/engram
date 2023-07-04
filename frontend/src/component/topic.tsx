import { MessageForm, MessageList } from './message';
import { responses } from '../types';
import { createTopic, getTopic, updateTopic } from '../service/topic';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { formatDate } from '../utils';
import {
  deleteMessage,
  getMessages,
  postMessage,
  updateMessage,
} from '../service/message';

export const EmptyTopic = () => {
  const [title, setTitle] = useState('');

  const newTopic = (text: string) => {
    void (async () => {
      const topicId = (
        await createTopic({
          title: title ?? `Untitled ${formatDate(Date.now())}`,
        })
      ).data.id;
      localStorage.setItem('pending-msg', text);
      route(`/${topicId}`);
    })();
  };

  return (
    <>
      <Title
        placeholder="Start a new topic..."
        title={title}
        setTitle={setTitle}
      />
      <MessageList messages={[]} replaceMessage={() => null} />
      <MessageForm onSubmit={newTopic} />
    </>
  );
};

export const Topic = ({ id }: { id: number }) => {
  const [title, setTitle] = useState('');
  const [messages, setMessages] = useState<responses['Message'][]>([]);
  const [last, setLast] = useState<responses['Message']>();

  useEffect(() => {
    void (async () => {
      // TODO parallel requests?
      const topic = await getTopic({ id });
      setTitle(topic.data.title);
      const res = await getMessages({ topicId: id });
      setMessages(res.data);

      const pendingMsg = localStorage.getItem('pending-msg');
      if (pendingMsg) {
        localStorage.removeItem('pending-msg');
        post(pendingMsg);
      }
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

  const changeTitle = (newTitle: string) => {
    setTitle(newTitle);
    void updateTopic({ id, title: newTitle });
  };

  const replaceMessage = (
    id: number,
    replacement: responses['Message'] | null,
  ) => {
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].id == id) {
        if (replacement == null) {
          // Delete the message
          messages.splice(i, 1);
          void deleteMessage({ messageId: id });
        } else {
          // Change message content
          messages.splice(i, 1, replacement);
          void updateMessage({ messageId: id, message: replacement.text });
        }
        setMessages([...messages]); // Copy list to inform Preact about changes
      }
    }
  };

  return (
    <>
      <Title placeholder="Unnamed topic" title={title} setTitle={changeTitle} />
      <MessageList
        messages={messages}
        last={last}
        replaceMessage={replaceMessage}
      />
      <MessageForm onSubmit={post} />
    </>
  );
};

const Title = ({
  placeholder,
  title,
  setTitle,
}: {
  placeholder: string;
  title: string;
  setTitle: (title: string) => void;
}) => {
  return (
    <h1 class="field">
      <input
        type="text"
        placeholder={placeholder}
        value={title}
        onChange={(event) => setTitle((event.target as HTMLInputElement).value)}
      />
    </h1>
  );
};
