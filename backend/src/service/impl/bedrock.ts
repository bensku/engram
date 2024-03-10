import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { CompletionService } from '../completion';
import { Message, extractText } from '../message';
import { Tool } from '../../tool/core';
import { XmlPromptSource } from '../../tool/prompt/xml';

const CLIENT = new BedrockRuntimeClient();
const TEXT_DECODER = new TextDecoder();

const TOOL_PROMPTER = new XmlPromptSource(true);

export function bedrockCompletions(
  model: string,
  modelStyle: 'claude' | 'cohere',
): CompletionService {
  return async function* (context, options) {
    let bodyText: string;
    if (modelStyle == 'claude') {
      const body: ClaudeBody = {
        prompt: claudePrompt(context, options.enabledTools ?? []),
        temperature: options.temperature,
        max_tokens_to_sample: options.maxTokens,
        stop_sequences: ['\n\nHuman:', '</tool_calls>'],
      };
      bodyText = JSON.stringify(body);
    } else if (modelStyle == 'cohere') {
      const body: CommandBody = {
        prompt: simplePrompt(context, options.enabledTools ?? []),
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        stream: true,
        stop_sequences: ['\nUser:'],
      };
      bodyText = JSON.stringify(body);
    } else {
      throw new Error();
    }
    const command = new InvokeModelWithResponseStreamCommand({
      modelId: model,
      body: bodyText,
      contentType: 'application/json',
    });
    const result = await CLIENT.send(command);
    if (result.body == undefined) {
      throw new Error('missing body'); // ???
    }
    const toolParser = TOOL_PROMPTER.newParser();
    for await (const entry of result.body) {
      if (entry.chunk) {
        if (modelStyle == 'claude') {
          const part = JSON.parse(
            TEXT_DECODER.decode(entry.chunk.bytes),
          ) as ClaudeCompletionPart;
          const text = toolParser.append(part.completion);
          if (text.trim()) {
            yield { type: 'text', text };
          }
        } else if (modelStyle == 'cohere') {
          const part = JSON.parse(
            TEXT_DECODER.decode(entry.chunk.bytes),
          ) as CommandCompletionPart;
          if (part.text) {
            const text = toolParser.append(part.text);
            if (text.trim()) {
              yield { type: 'text', text };
            }
          }
        }
      } else {
        // TODO better error reporting
        throw new Error(`bedrock API error`);
      }
    }
    const calls = toolParser.parse();
    if (calls.length > 0) {
      yield { type: 'tool', calls };
    }
    yield { type: 'end' };
  };
}

function formatClaudeMessage(msg: Message): string {
  if (msg.type == 'bot') {
    return msg.toolCalls
      ? `\n\nAssistant: ${TOOL_PROMPTER.toolMessage(msg.toolCalls)}`
      : `\n\nAssistant:${extractText(msg)}`;
  } else if (msg.type == 'user') {
    return `\n\nHuman:${extractText(msg)}`;
  } else if (msg.type == 'tool') {
    return `\n---\n${extractText(msg)}`;
  } else {
    throw new Error();
  }
}

function claudePrompt(context: Message[], tools: Tool<object>[]): string {
  let toolMsg = '';
  if (tools.length > 0) {
    toolMsg = `
${TOOL_PROMPTER.systemPrompt(tools)}
`;
  }

  // Anthropic recommends including important instructions in first user message
  // TODO this is outdated, Claude 2.1 supports system prompts!
  return (
    `\n\nHuman: ${extractText(context[0])}
${toolMsg}
BEGIN DIALOGUE

${formatClaudeMessage(context[1])}` +
    context
      .slice(2)
      .map((msg) => formatClaudeMessage(msg))
      .join() +
    '\n\nAssistant:'
  );
}

interface ClaudeBody {
  prompt: string;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  max_tokens_to_sample?: number;
  stop_sequences?: string[];
}

interface ClaudeCompletionPart {
  completion: string;
  stop_reason?: string;
  stop?: string;
}

function formatSimpleMessage(msg: Message): string {
  if (msg.type == 'bot') {
    return msg.toolCalls
      ? `\nAssistant: ${TOOL_PROMPTER.toolMessage(msg.toolCalls)}`
      : `\nAssistant:${extractText(msg)}`;
  } else if (msg.type == 'user') {
    return `\nUser:${extractText(msg)}`;
  } else if (msg.type == 'tool') {
    return `\n---\n${extractText(msg)}`;
  } else {
    throw new Error();
  }
}

function simplePrompt(context: Message[], tools: Tool<object>[]): string {
  let toolMsg = '';
  if (tools.length > 0) {
    toolMsg = `
${TOOL_PROMPTER.systemPrompt(tools)}
`;
  }
  return (
    `${extractText(context[0])}\n\n${toolMsg}\n` +
    context
      .slice(1)
      .map((msg) => formatSimpleMessage(msg))
      .join() +
    '\nAssistant:'
  );
}

interface CommandBody {
  prompt: string;
  temperature?: number;
  p?: number;
  k?: number;
  max_tokens?: number;
  stop_sequences?: string[];
  return_likelihoods?: 'GENERATION' | 'ALL' | 'NONE';
  stream?: boolean;
  num_generations?: number;
}

interface CommandCompletionPart {
  is_finished: boolean;
  text?: string;
  finish_reason?: string;
}
