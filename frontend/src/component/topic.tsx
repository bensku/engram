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
import {
  currentTopic,
  pendingAttachments,
  pendingMessage,
  speechInputEnabled,
  speechInputHandler,
} from '../state';
import { BASE_URL } from '../service/api';
import { Howl } from 'howler';
import { DropZone, addAttachment } from './attachment';
import { showAlert } from './alert';

export const EmptyTopic = ({
  updateTopic,
}: {
  updateTopic: (
    topic: Partial<responses['Topic']>,
    updateServer: 'never' | 'always',
  ) => Promise<number>;
}) => {
  const newTopic = (message: string, format: string) => {
    void (async () => {
      const topicId = await updateTopic({}, 'always');
      pendingMessage.value = { content: message, format };
      route(`/${topicId}`);
    })();
  };

  speechInputHandler.value = (audio) => newTopic(audio, 'speech');

  return (
    <>
      <DropZone handler={addAttachment}>
        <Title
          placeholder="Start a new topic..."
          title={currentTopic.value.title ?? ''}
          setTitle={(title) => void updateTopic({ title: title }, 'never')}
        />
        <MessageList
          messages={[]}
          replaceMessage={() => null}
          regenerate={() => null}
        />
        <MessageForm
          onSubmit={(text) => newTopic(text, 'text')}
          uploadHandler={addAttachment}
        />
      </DropZone>
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

      if (pendingMessage.value) {
        const msg = pendingMessage.value;
        pendingMessage.value = null;
        void post(msg.content, msg.format);
      }
    })();
  }, [id]);

  const post = async (message: string, format: string) => {
    // Post user message to server
    const reply = postMessage({
      topicId: id,
      message: { message, format, attachments: pendingAttachments.value },
    });
    pendingAttachments.value = [];

    // Stream reply back from server
    // When server is finished, prepare for user reply
    let msg: responses['BotMessage'] | null = null;
    for await (const part of reply) {
      if (part.type == 'start') {
        if (part.replyTo) {
          messages.push(part.replyTo as responses['Message']);
        }
        if (msg && msg.parts.length > 0) {
          messages.push(msg);
          setLast(undefined); // Avoid briefly displaying same message twice!
        }
        msg = {
          type: 'bot',
          id: -1,
          agent: part.agent,
          parts: [{ type: 'text', text: '' }],
          time: part.time,
        };
        setMessages([...messages]);
      } else if (part.type == 'msg') {
        if (msg == null) {
          throw new Error('wrong order in reply stream');
        }
        (msg.parts[0] as responses['TextPart']).text += part.data;
        setLast({ ...msg });
      } else if (part.type == 'fragment') {
        // TODO refactor fragment handling out of here!
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
            parts: [{ type: 'text', text: part.data.text }],
            time: Date.now(),
          });
          setMessages([...messages]);
        } else if (part.data.type == 'userMessage') {
          showAlert(part.data.kind, part.data.msg);
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

    // After message has been received, read it out loud (if speech mode is enabled)
    if (speechInputEnabled.value) {
      const text = msg?.parts
        .map((part) => (part.type == 'text' ? part.text : ''))
        .join('');
      if (text) {
        new Howl({
          src: `${BASE_URL}/tts/${encodeURIComponent(text)}`,
          html5: true,
          autoplay: true,
          format: 'opus',
          onloaderror: (_, error) => {
            console.error(error);
          },
          onplayerror: (_, error) => {
            console.error(error);
          },
        });
      }
    }
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
            // TODO attachment addition/removal?
            message: replacement.parts
              .map((part) => (part.type == 'text' ? part.text : ''))
              .join(''),
            format: 'text',
            attachments: [], // TODO implement; how to get attachments from parts?
          });
        }
        setMessages([...messages]); // Copy list to inform Preact about changes
      }
    }
  };

  const regenerate = () => {
    void post('Try again.', 'text');
  };

  speechInputHandler.value = (audio) => void post(audio, 'speech');

  return (
    <>
      <Title
        placeholder="Unnamed topic"
        title={currentTopic.value.title ?? ''}
        setTitle={updateTitle}
      />
      <DropZone handler={addAttachment}>
        <MessageList
          messages={messages}
          last={last}
          replaceMessage={replaceMessage}
          regenerate={regenerate}
        />
        <MessageForm
          onSubmit={(text) => void post(text, 'text')}
          uploadHandler={addAttachment}
        />
      </DropZone>
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
