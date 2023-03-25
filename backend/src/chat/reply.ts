import { randomUUID } from 'crypto';
import { PassThrough } from 'stream';
import { CompletionEnd, completionsForModel } from '../service/completion';
import { Message } from '../service/message';
import { TopicOptions } from './options';

export class ReplyStream {
  #stream: PassThrough;

  constructor() {
    this.#stream = new PassThrough();
  }

  appendToMsg(data: string) {
    const entry = {
      type: 'msg',
      data,
    };
    this.#stream.write(`data: ${JSON.stringify(entry)}\n\n`);
  }

  close() {
    this.#stream.write('data: {"type": "end"}');
    this.#stream.end();
  }

  get nodeStream(): unknown {
    return this.#stream;
  }
}

export async function generateReply(
  out: ReplyStream,
  context: Message[],
  options: TopicOptions,
): Promise<Message> {
  const completions = completionsForModel(options.model);
  // Stream (but also collect) the final completion
  let text = '';
  for await (const part of completions(context)) {
    if (part == CompletionEnd) {
      out.close();
      break;
    } else {
      text += part;
      out.appendToMsg(part);
    }
  }

  return { type: 'bot', id: randomUUID(), text, widgets: [] };
}
