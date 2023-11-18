import { MessageForm, MessageList } from './message';
import { responses } from '../types';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import {
  deleteMessage,
  getMessages,
  postMessage,
  updateMessage,
} from '../service/message';
import { debounce } from '../debounce';
import { currentTopic } from '../state';

export const EmptyTopic = ({
  updateTopic,
}: {
  updateTopic: (
    topic: Partial<responses['Topic']>,
    updateServer: 'never' | 'always',
  ) => Promise<number>;
}) => {
  const newTopic = (text: string) => {
    void (async () => {
      const topicId = await updateTopic({}, 'always');
      localStorage.setItem('pending-msg', text);
      route(`/${topicId}`);
    })();
  };

  return (
    <>
      <Title
        placeholder="Start a new topic..."
        title={currentTopic.value.title ?? ''}
        setTitle={(title) => void updateTopic({ title: title }, 'never')}
      />
      <MessageList messages={[]} replaceMessage={() => null} />
      <MessageForm onSubmit={newTopic} />
    </>
  );
};

export const Topic = ({
  id,
  updateTopic,
}: {
  id: number;
  updateTopic: (
    topic: Partial<responses['Topic']>,
    updateServer: 'never' | 'always',
  ) => Promise<number>;
}) => {
  const [messages, setMessages] = useState<responses['Message'][]>([]);
  const [last, setLast] = useState<responses['Message']>();

  useEffect(() => {
    void (async () => {
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
      let msg: responses['BotMessage'] | null = null;
      for await (const part of reply) {
        if (part.type == 'start') {
          if (part.replyTo) {
            messages.push({
              type: 'user',
              id: part.replyTo.id,
              text,
              time: part.replyTo.time,
            });
          }
          if (msg && msg.text) {
            messages.push(msg);
            setLast(undefined); // Avoid briefly displaying same message twice!
          }
          msg = {
            type: 'bot',
            id: -1,
            agent: '',
            text: '',
            time: Date.now(),
          };
          msg.agent = part.agent;
          msg.time = part.time;
          setMessages([...messages]);
        } else if (part.type == 'msg') {
          if (msg == null) {
            throw new Error('wrong order in reply stream');
          }
          msg.text += part.data;
          setLast({ ...msg });
        } else if (part.type == 'fragment') {
          // TODO proper fragment handling
          if (part.data.type == 'title') {
            void updateTopic({ title: part.data.title }, 'never');
          } else if (part.data.type == 'toolCall') {
            // TODO show something about tool call in flight
          } else if (part.data.type == 'toolCallCompleted') {
            messages.push({
              type: 'tool',
              id: Date.now(), // Just something that won't have duplicates
              tool: part.data.tool,
              callId: '',
              text: part.data.text,
              time: Date.now(),
            });
            setMessages([...messages]);
          }
        } else if (part.type == 'end') {
          // Don't refer to last, it has not been updated
          if (msg == null) {
            throw new Error('wrong order in reply stream');
          }
          msg.id = part.id;
          setMessages([...messages, msg]);
          setLast(undefined);
        } // else: should never happen
      }
    })();
  };

  const updateTitle = debounce((newTitle: string) => {
    void updateTopic({ id, title: newTitle }, 'always');
  }, 250);

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
          void updateMessage({
            messageId: id,
            message: replacement.text ?? '',
          });
        }
        setMessages([...messages]); // Copy list to inform Preact about changes
      }
    }
  };

  return (
    <>
      <Title
        placeholder="Unnamed topic"
        title={currentTopic.value.title ?? ''}
        setTitle={updateTitle}
      />
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
    <h1 class="field topic-title">
      <input
        type="text"
        placeholder={placeholder}
        value={title}
        onChange={(event) => setTitle((event.target as HTMLInputElement).value)}
      />
    </h1>
  );
};
