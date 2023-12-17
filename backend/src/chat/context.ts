import { DbMessageStorage } from '../service/impl/postgres';
import { Message, MessageStorage } from '../service/message';
import { TopicOptions } from '../service/topic';
import { ChatEngine } from './engine';
import { PROMPT, SPEECH_MODE } from './options';
import { promptMessages } from './prompt';

const storage: MessageStorage = new DbMessageStorage();

export async function fullContext(topicId: number): Promise<Message[]> {
  return (await storage.get(topicId)) ?? [];
}

export async function topicContext(
  topicId: number,
  engine: ChatEngine,
  options: TopicOptions,
): Promise<Message[]> {
  let context = (await storage.get(topicId)) ?? [];
  context = [
    ...promptMessages(PROMPT.getOrThrow(engine, {}), engine, options),
    ...context,
  ];

  if (SPEECH_MODE.get(engine, options.options)) {
    context[0] = {
      ...context[0],
      text: `${
        context[0].text ?? ''
      }\n\nYou are in a voice call with the user. Most of the time, your lines should be a sentence or two, unless the user requests reasoning or long-form outputs. Don't include links in your lines, as they cannot be read out loud.`,
    };
  }

  return context;
}

export async function appendContext(
  topicId: number,
  message: Message,
): Promise<number> {
  return storage.append(topicId, message);
}

export function updateMessage(id: number, content: string): Promise<void> {
  return storage.update(id, content);
}

export function deleteMessage(id: number): Promise<void> {
  return storage.delete(id);
}
