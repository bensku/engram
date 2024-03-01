import { Message } from './message';

export type TokenCounterService = (msg: Message) => number;

export function simpleTokenCounter(tokensPerChar: number): TokenCounterService {
  return (msg) => {
    let tokens = 0;
    for (const part of msg.parts) {
      if (part.type == 'text') {
        tokens += part.text.length * tokensPerChar;
      }
    }
    return tokens;
  };
}
