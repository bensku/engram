import { Message } from '../service/message';

export function simplePrompt(system: string, user?: string): Message[] {
  const msgs: Message[] = [
    { type: 'system', id: -2, text: system, time: Date.now() },
  ];
  if (user) {
    msgs.push({ type: 'user', id: -1, text: user, time: Date.now() });
  }
  return msgs;
}
