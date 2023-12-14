import { ReadableStream } from 'stream/web';
import { CompletionService } from '../completion';
import { components, paths } from '../../../generated/together';
import { Message } from '../message';
import { readLines } from '@bensku/engram-shared/src/sse';
import { Tool } from '../../tool/core';
import { RavenPromptSource } from '../../tool/prompt/raven';

export function togetherCompletions(
  apiKey: string,
  promptStyle: PromptStyle,
  model: string,
): CompletionService {
  const apiUrl = 'https://api.together.xyz';
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  const formatter = PROMPT_FORMATTERS[promptStyle];

  return async function* (context, options) {
    const body: paths['/inference']['post']['requestBody'] = {
      content: {
        'application/json': {
          stream_tokens: true,
          model,
          prompt: formatter(context, options.enabledTools ?? []),
          temperature: options.temperature,
          max_tokens: options.maxTokens,
          stop: STOP_TOKENS[promptStyle],
        },
      },
    };
    const response = await fetch(`${apiUrl}/inference`, {
      method: 'POST',
      body: JSON.stringify(body.content['application/json']),
      headers,
    });
    const reader = (
      response.body as unknown as ReadableStream<Uint8Array>
    ).getReader();

    const callParser = RAVEN_PROMPTER.newParser();
    for await (const line of readLines(reader)) {
      if (line.trim() == 'data: [DONE]') {
        if (promptStyle == 'nexusraven') {
          // Yield the tool calls
          yield { type: 'tool', calls: callParser.parse() };
        }
        yield { type: 'end' };
      } else if (line.startsWith('data: ')) {
        let part: CompletionPart;
        try {
          part = JSON.parse(line.substring('data: '.length)) as CompletionPart;
        } catch (e) {
          console.error(`Invalid JSON response: ${line}`);
          throw e;
        }
        if (promptStyle == 'nexusraven') {
          callParser.append(part.choices[0].text);
        } else {
          yield { type: 'text', text: part.choices[0].text };
        }
      } else if (line.length > 0) {
        // Probably an error, better log it
        console.error(line);
      }
    }
  };
}

type PromptStyle = 'mistral' | 'nexusraven' | 'chatml';
type PromptFormatter = (context: Message[], tools: Tool<object>[]) => string;

const PROMPT_FORMATTERS: Record<PromptStyle, PromptFormatter> = {
  mistral: (context) => {
    // <s> [INST] Instruction [/INST] Model answer</s> [INST] Follow-up instruction [/INST]
    return (
      `<s> [INST] ${context[0].text ?? ''}\n\nBEGIN DIALOGUE\n\n${
        context[1].text ?? ''
      } [/INST]` +
      context
        .slice(2)
        .map((msg) => {
          if (msg.type == 'bot') {
            return `${
              msg.text ?? RAVEN_PROMPTER.toolMessage(msg.toolCalls ?? [])
            }</s>`;
          } else if (msg.type == 'tool') {
            return `[INST] ${msg.text} [/INST]`; // TODO format
          } else if (msg.type == 'user') {
            return `[INST] ${msg.text} [/INST]`;
          }
        })
        .join(' ')
    );
  },

  nexusraven: (context, tools) => {
    let chatCtx: string;
    if (context.length == 1) {
      chatCtx = '';
    } else {
      chatCtx =
        'Context:\n' +
        context
          .filter((msg) => msg.type == 'user' || msg.type == 'bot')
          .map((msg) => {
            msg.type == 'user'
              ? `User: ${msg.text}`
              : `Assistant: ${msg.text ?? ''}`;
          })
          .join('\n');
    }
    return `${tools
      .map((tool) => RAVEN_PROMPTER.toolToPrompt(tool))
      .join('\n\n')}

User Query: ${context[context.length - 1].text ?? ''}${chatCtx}<human_end>

`;
  },

  chatml: (context) => {
    return (
      context
        .map((msg) => {
          let source;
          if (msg.type == 'bot' || msg.type == 'tool') {
            // TODO distinguish tool messages?
            source = 'assistant';
          } else if (msg.type == 'user') {
            source = 'user';
          } else if (msg.type == 'system') {
            source = 'system';
          } else {
            throw new Error();
          }
          return `<|im_start|>${source}\n${msg.text ?? ''}<|im_end|>`;
        })
        .join('\n') + '\n<|im_start|>assistant\n'
    );
  },
};

const STOP_TOKENS: Record<PromptStyle, string> = {
  mistral: '</s',
  nexusraven: '<bot_end>',
  chatml: '<|im_end|>',
};

const RAVEN_PROMPTER = new RavenPromptSource();

interface CompletionPart {
  choices: {
    text: string;
  }[];
  result_type: string;
  id: string;
}
