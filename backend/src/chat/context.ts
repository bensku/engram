import { RedisMessageStorage } from '../service/impl/redis';
import { Message, MessageStorage } from '../service/message';
import { TopicOptions } from './options';
import { getPrompt } from './prompt';

const storage: MessageStorage = new RedisMessageStorage();

export async function fullContext(topicId: string): Promise<Message[]> {
  return (await storage.get(topicId)) ?? [];
}

export async function topicContext(
  topicId: string,
  options: TopicOptions,
): Promise<Message[]> {
  let context = (await storage.get(topicId)) ?? [];
  context = [...getPrompt(options.prompt), ...context];
  return context;
}

export async function appendContext(
  topicId: string,
  ...messages: Message[]
): Promise<void> {
  for (const msg of messages) {
    await storage.append(topicId, msg);
  }
}
