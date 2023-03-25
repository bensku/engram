import { Message } from '../service/message';

function simplePrompt(system: string, user?: string): Message[] {
  const msgs: Message[] = [{ type: 'system', id: 'system', text: system }];
  if (user) {
    msgs.push({ type: 'user', id: 'injected', text: user });
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
