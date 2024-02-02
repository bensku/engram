import { PassThrough } from 'stream';
import { completionsForModel } from '../service/completion';
import { Message } from '../service/message';
import { Fragment } from '@bensku/engram-shared/src/types';
import { MODEL } from './options';
import { GenerateContext } from './pipeline';
import { toModelOptions } from './engine';

export class ReplyStream {
  #stream: PassThrough;

  constructor() {
    this.#stream = new PassThrough();
  }

  start(replyTo: Message | null, agent: string, time: number) {
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
    this.#stream.write(`data: {"type": "end", "id": "${id}"}`);
    this.#stream.end();
  }

  get nodeStream(): unknown {
    return this.#stream;
  }
}

export async function generateReply(
  out: ReplyStream,
  ctx: GenerateContext,
): Promise<Message> {
  const completions = completionsForModel(MODEL.getOrThrow(ctx));
  // Stream (but also collect) the final completion
  let text = '';
  for await (const part of completions(ctx.context, toModelOptions(ctx))) {
    if (part.type == 'text') {
      text += part.text;
      out.appendToMsg(part.text);
    } else if (part.type == 'tool') {
      // This assumes that tool call part comes last
      return {
        type: 'bot',
        id: -1,
        text,
        toolCalls: part.calls,
        agent: ctx.engine.id,
        time: Date.now(),
      };
    } else {
      break; // end
    }
  }

  return {
    type: 'bot',
    id: -1,
    text,
    agent: ctx.engine.id,
    time: Date.now(),
  };
}
