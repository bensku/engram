import { Message } from './message';

export type TokenCounterService = (msg: Message) => number;

export function simpleTokenCounter(tokensPerChar: number): TokenCounterService {
  return (msg) => Math.ceil(tokensPerChar * (msg.text?.length ?? 0));
}
