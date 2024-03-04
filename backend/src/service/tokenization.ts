import { Message } from './message';

export type TokenCounterService = (msg: Message) => number;

export function simpleTokenCounter(
  tokensPerChar: number,
  tokensPerImage = 1000,
): TokenCounterService {
  return (msg) => {
    let tokens = 0;
    for (const part of msg.parts) {
      if (part.type == 'text') {
        tokens += part.text.length * tokensPerChar;
      } else if (part.type == 'image') {
        tokens += tokensPerImage;
      }
    }
    return tokens;
  };
}
