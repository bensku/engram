import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { CompletionService } from '../completion';
import { Message } from '../message';
import { Tool } from '../../tool/core';
import { parseToolCalls, toolsToPrompt } from '../../tool/prompt';
import { ToolCall } from '../../tool/call';

const CLIENT = new BedrockRuntimeClient();
const TEXT_DECODER = new TextDecoder();

export function bedrockCompletions(
  model: string,
  modelStyle: 'claude' | 'cohere' | 'ai21',
): CompletionService {
  return async function* (context, options) {
    let bodyText: string;
    if (modelStyle == 'claude') {
      const body: ClaudeBody = {
        prompt: claudePrompt(context, options.enabledTools ?? []),
        temperature: options.temperature,
        max_tokens_to_sample: options.maxTokens,
        stop_sequences: ['\n\nHuman:'],
      };
      console.log(body.prompt);
      bodyText = JSON.stringify(body);
    } else if (modelStyle == 'cohere') {
      const body: CommandBody = {
        prompt: simplePrompt(context),
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
    let ongoingCall = false;
    let toolCall = '';
    for await (const entry of result.body) {
      if (entry.chunk) {
        if (modelStyle == 'claude') {
          const part = JSON.parse(
            TEXT_DECODER.decode(entry.chunk.bytes),
          ) as ClaudeCompletionPart;
          if (part.completion.startsWith('<calls')) {
            toolCall += part.completion;
            ongoingCall = true;
          } else if (ongoingCall) {
            const end = part.completion.indexOf('</calls>');
            if (end == -1) {
              toolCall += part.completion;
            } else {
              toolCall += part.completion.substring(0, end + 8);
              ongoingCall = false;
            }
          } else {
            if (toolCall != '') {
              yield { type: 'tool', calls: parseClaudeToolCall(toolCall) };
              toolCall = '';
            }
            yield { type: 'text', text: part.completion };
          }
        } else if (modelStyle == 'cohere') {
          const part = JSON.parse(
            TEXT_DECODER.decode(entry.chunk.bytes),
          ) as CommandCompletionPart;
          if (part.text) {
            yield { type: 'text', text: part.text };
          }
        }
      } // TODO: else handle errors
    }
    if (toolCall) {
      yield { type: 'tool', calls: parseClaudeToolCall(toolCall) };
    }
    yield { type: 'end' };
  };
}

function parseClaudeToolCall(text: string): ToolCall[] {
  // Just remove the start and stop tags
  return parseToolCalls(text.replace('<calls>', '').replace('</calls>', ''));
}

function formatClaudeMessage(msg: Message): string {
  if (msg.type == 'bot') {
    return msg.toolCalls
      ? '\n\nAssistant: Let me use use an external tool, second...'
      : `\n\nAssistant:${msg.text ?? ''}`;
  } else if (msg.type == 'user') {
    return `\n\nHuman:${msg.text}`;
  } else if (msg.type == 'tool') {
    return `\n\nHuman: [SYSTEM] Call completed. Your results:\n<results>\n${msg.text}\n</results>`;
  } else {
    throw new Error();
  }
}

function claudePrompt(context: Message[], tools: Tool<object>[]): string {
  let toolMsg = '';
  if (tools.length > 0) {
    toolMsg = `
You have access to several external tools. Use that when you think is appropriate.
<tools>
${toolsToPrompt(tools)}
</tools>

To use tools, write calls for them in your reply as if they were TypeScript functions. Wrap your replies in calls tag, for example:
<calls>
example_tool("Argument 1", "Argument 2")
another_tool("Some text")
</calls>

You decide when to call a tool. If no tools are applicable, then don't call them! When you do decide to call a tool, please write NOTHING else.

The system will provide you results from the tool call results tag, like this:
<results>
Hello from Internet!
</results>
`;
  }

  // Anthropic recommends including important instructions in first user message
  // TODO evaluate this
  return (
    `\n\nHuman: ${context[0].text ?? ''}
${context[context.length - 1].type == 'tool' ? '' : toolMsg}
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

function simplePrompt(context: Message[]): string {
  return (
    `${context[0].text ?? ''}\n` +
    context
      .slice(1)
      .map(
        (msg) =>
          `${msg.type == 'bot' ? '\nAssistant:' : '\nUser:'}${msg.text ?? ''}`,
      )
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
