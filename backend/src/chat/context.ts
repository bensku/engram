import { DbMessageStorage } from '../service/impl/postgres';
import { Message, MessageStorage } from '../service/message';
import { ChatEngine } from './engine';
import { PROMPT } from './options';

const storage: MessageStorage = new DbMessageStorage();

export async function fullContext(topicId: number): Promise<Message[]> {
  return (await storage.get(topicId)) ?? [];
}

export async function topicContext(
  topicId: number,
  engine: ChatEngine,
): Promise<Message[]> {
  let context = (await storage.get(topicId)) ?? [];
  context = [...PROMPT.getOrThrow(engine, {}), ...context];
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
