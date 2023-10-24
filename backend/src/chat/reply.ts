import { PassThrough } from 'stream';
import { CompletionEnd, completionsForModel } from '../service/completion';
import { Message } from '../service/message';
import { TopicOptions } from '../service/topic';
import { ChatEngine, toModelOptions } from './engine';
import { Fragment } from '@bensku/engram-shared/src/types';

export class ReplyStream {
  #stream: PassThrough;

  constructor() {
    this.#stream = new PassThrough();
  }

  start(replyTo: Message, agent: string, time: number) {
    const entry = {
      type: 'start',
      replyTo,
      agent,
      time,
    };
    this.#stream.write(`data: ${JSON.stringify(entry)}\n\n`);
  }

  appendToMsg(data: string) {
    const entry = {
      type: 'msg',
      data,
    };
    this.#stream.write(`data: ${JSON.stringify(entry)}\n\n`);
  }

  sendFragment(fragment: Fragment) {
    const entry = {
      type: 'fragment',
      data: fragment,
    };
    this.#stream.write(`data: ${JSON.stringify(entry)}\n\n`);
  }

  close(id: number) {
    this.#stream.write(`data: {"type": "end", "id": ${id}}`);
    this.#stream.end();
  }

  get nodeStream(): unknown {
    return this.#stream;
  }
}

export async function generateReply(
  out: ReplyStream,
  context: Message[],
  engine: ChatEngine,
): Promise<Message> {
  const completions = completionsForModel(engine.model);
  // Stream (but also collect) the final completion
  let text = '';
  for await (const part of completions(context, toModelOptions(engine))) {
    if (part == CompletionEnd) {
      break;
    } else {
      text += part;
      out.appendToMsg(part);
    }
  }

  return {
    type: 'bot',
    id: -1,
    text,
    agent: engine.id,
    time: Date.now(),
  };
}
