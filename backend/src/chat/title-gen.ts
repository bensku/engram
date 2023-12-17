import { batchCompletionsForModel } from '../service/completion';
import { DbTopicStorage } from '../service/impl/postgres';
import { Message } from '../service/message';

const TITLE_PROMPT = `Generate a a short (few words) title of the above conversation.

Examples:
Streaming OpenAI Completions
Creating a MUD Game in Python
Quick and Easy Cooking Ideas
Willowisp's Magical Journey
Fairy Names for A Fantasy Story

Ignore this message in title generation. Do not refer to yourself or title generation. Reply only with the title, without including the prefix "AI Assistant"

The title:
`;

const titleGenerator = batchCompletionsForModel('openai:gpt-3.5-turbo');

export async function generateTitle(context: Message[]): Promise<string> {
  const titleCtx: Message[] = [
    {
      type: 'system',
      id: 0,
      time: Date.now(),
      text: 'You are a title generation bot for an AI assistant.',
    },
    ...context.slice(1),
    {
      type: 'user',
      id: 0,
      time: 0,
      text: TITLE_PROMPT,
    },
  ];
  const title = await titleGenerator(titleCtx, {
    maxTokens: 20,
    temperature: 0.1,
  });
  return title.replace('"', '');
}

const storage = new DbTopicStorage();

export async function updateTitle(
  topicId: number,
  title: string,
): Promise<void> {
  await storage.save({ id: topicId, title });
}
