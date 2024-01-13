import { ReadableStream } from 'stream/web';
import { readLines } from '@bensku/engram-shared/src/sse';
import { components, paths } from '../../../generated/openai';
import { CompletionService, ModelOptions } from '../completion';
import { Message } from '../message';
import { TranscriptionService } from '../transcription';
import { TtsService } from '../tts';

export function openAICompletions(
  apiUrl: string,
  apiKey: string,
  type: 'chat' | 'chatml' | 'mistral',
  model: string,
): CompletionService {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  if (type == 'chat' || type == 'mistral') {
    return async function* (context, options) {
      const body: paths['/chat/completions']['post']['requestBody']['content']['application/json'] & {
        safe_mode?: boolean;
      } = {
        stream: true,
        model,
        messages: context.map(chatGptMessage),
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        tools: toolList(options),
        safe_mode: type == 'mistral' ? false : undefined,
      };
      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers,
      });
      const reader = (
        response.body as unknown as ReadableStream<Uint8Array>
      ).getReader();

      const partialCalls: PartialCall[] = [];

      // TODO error handling
      for await (const line of readLines(reader)) {
        if (line.trim() == 'data: [DONE]') {
          if (partialCalls.length > 0) {
            // Yield the function calls all at once
            yield {
              type: 'tool',
              calls: partialCalls.map((partial) => ({
                id: partial.callId,
                tool: partial.tool,
                // TODO handle invalid JSON? can that even happen anymore?
                arguments: JSON.parse(partial.partialArgs) as Record<
                  string,
                  unknown
                >,
              })),
            };
          }
          yield { type: 'end' };
        } else if (line.startsWith('data: ')) {
          let part: ChatCompletionPart;
          try {
            // FIXME perplexity API seems to return line breaks, is readLines() bugged?
            part = JSON.parse(
              line.substring('data: '.length),
            ) as ChatCompletionPart;
          } catch (e) {
            console.error(`Invalid JSON response: '${line}'`);
            throw e;
          }
          // OpenAI API streams function arguments
          // This is not very useful to us, so we'll yield them as one unit
          const delta = part.choices[0].delta;
          if (delta.tool_calls) {
            for (const callDelta of delta.tool_calls) {
              const callIndex = callDelta.index ?? 0; // Some OpenAI API clones only support one call
              let partial = partialCalls[callIndex];
              if (!partial) {
                // First delta for the tool includes its name and call id
                partial = {
                  tool: callDelta.function.name,
                  callId: callDelta.id ?? '',
                  partialArgs: callDelta.function.arguments,
                };
                partialCalls[callIndex] = partial;
              } else {
                // Rest of the deltas only include (streamed) function arguments
                partial.partialArgs += callDelta.function.arguments;
              }
            }
          } else if (delta.content) {
            // Stream text to user as it is generated
            yield { type: 'text', text: delta.content };
          }
        } else if (line.length > 0) {
          // Probably an error, better log it
          console.error(line);
        }
      }
    };
  } else if (type == 'chatml') {
    return async function* (context, options) {
      const body: paths['/completions']['post']['requestBody']['content']['application/json'] =
        {
          stream: true,
          model,
          prompt: chatMlPrompt(context),
          temperature: options.temperature,
          max_tokens: options.maxTokens,
          stop: ['user'],
        };
      const response = await fetch(`${apiUrl}/completions`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers,
      });
      const reader = (
        response.body as unknown as ReadableStream<Uint8Array>
      ).getReader();

      for await (const line of readLines(reader)) {
        if (line.trim() == 'data: [DONE]') {
          yield { type: 'end' };
        } else if (line.startsWith('data: ')) {
          let part: TextCompletionPart;
          try {
            part = JSON.parse(
              line.substring('data: '.length),
            ) as TextCompletionPart;
          } catch (e) {
            console.error(`Invalid JSON response: ${line}`);
            throw e;
          }
          yield { type: 'text', text: part.choices[0].text };
        } else if (line.length > 0) {
          // Probably an error, better log it
          console.error(line);
        }
      }
    };
  } else {
    throw new Error('unknown completions type');
  }
}

interface PartialCall {
  tool: string;
  callId: string;
  partialArgs: string;
}

function chatGptMessage(
  message: Message,
): components['schemas']['ChatCompletionRequestMessage'] {
  if (message.type == 'system') {
    return {
      role: 'system',
      content: message.text,
    };
  } else if (message.type == 'bot') {
    return {
      role: 'assistant',
      content: message.text ?? null,
      tool_calls: message.toolCalls?.map((call) => ({
        id: call.id,
        type: 'function',
        function: {
          name: call.tool,
          arguments: JSON.stringify(call.arguments),
        },
      })),
    };
  } else if (message.type == 'tool') {
    return {
      role: 'tool',
      content: message.text,
      tool_call_id: message.callId,
    };
  } else if (message.type == 'user') {
    return {
      role: 'user',
      content: message.text,
    };
  } else {
    throw new Error('unknown message type');
  }
}

function toolList(
  options: ModelOptions,
): components['schemas']['ChatCompletionTool'][] | undefined {
  const tools: components['schemas']['ChatCompletionTool'][] = (
    options.enabledTools ?? []
  ).map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.argsSchema,
    },
  }));
  // OpenAI API allows only non-empty tool list, use undefined if there are no tools
  return tools.length > 0 ? tools : undefined;
}

interface GptToolCall {
  index?: number;
  id?: string;
  type?: string;
  function: {
    name: string;
    arguments: string;
  };
}

interface ChatCompletionPart {
  choices: {
    delta: { content?: string; tool_calls: GptToolCall[] };
    index: number;
    finish_reason: string | null;
  }[];
}

function chatMlPrompt(context: Message[]): string {
  return (
    context.map(formatChatMlMessage).join('\n') + '\n<|im_start|>assistant\n'
  );
}

function formatChatMlMessage(msg: Message) {
  let source;
  if (msg.type == 'bot') {
    source = 'assistant';
  } else if (msg.type == 'user') {
    source = 'user';
  } else if (msg.type == 'system') {
    source = 'system';
  } else {
    throw new Error('tools are not yet supported for ChatML');
  }
  return `<|im_start|>${source}\n${msg.text ?? ''}<|im_end|>`;
}

interface TextCompletionPart {
  choices: {
    text: string;
    index: 0;
  }[];
}

export function openAITranscriptions(
  apiKey: string,
  model: string,
): TranscriptionService {
  return async (audio, language) => {
    const formData = new FormData();
    formData.append(
      'file',
      new Blob([Buffer.from(audio)], { type: 'audio/wav' }),
    );
    formData.append('model', model);
    if (language) {
      formData.append('language', language);
    }

    const response = await fetch(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      },
    );
    const result =
      (await response.json()) as components['schemas']['CreateTranscriptionResponse'];
    return result.text;
  };
}

export function openAITts(apiKey: string, model: string): TtsService {
  return async function* (text, voice) {
    const body: paths['/audio/speech']['post']['requestBody']['content']['application/json'] =
      {
        model,
        input: text,
        // OpenAI API actually types the allowed voices, which is nice... except that we want to support other TTS providers too
        voice:
          voice as paths['/audio/speech']['post']['requestBody']['content']['application/json']['voice'],
        response_format: 'opus',
      };
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const reader = (response.body as ReadableStream<Uint8Array>).getReader();
    for (;;) {
      const { value } = await reader.read();
      if (!value) {
        break;
      }
      yield value;
    }
  };
}
