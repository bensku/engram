import { Message } from '../service/message';

function simplePrompt(system: string, user?: string): Message[] {
  const msgs: Message[] = [
    { type: 'system', id: -2, text: system, time: Date.now() },
  ];
  if (user) {
    msgs.push({ type: 'user', id: -1, text: user, time: Date.now() });
  }
  return msgs;
}

const PROMPTS: Record<string, Message[]> = {
  assistant: simplePrompt('You are a helpful AI assistant'),
};

export function getPrompt(id: string) {
  const prompt = PROMPTS[id];
  if (!prompt) {
    throw new Error('missing prompt');
  }
  return prompt;
}
