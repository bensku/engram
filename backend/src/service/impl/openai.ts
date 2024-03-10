import { ReadableStream } from 'stream/web';
import { readLines } from '@bensku/engram-shared/src/sse';
import { components, paths } from '../../../generated/openai';
import { CompletionService, ModelOptions } from '../completion';
import { Message, MessagePart, extractText } from '../message';
import { TranscriptionService } from '../transcription';
import { TtsService } from '../tts';
import { JSONSchemaType } from 'ajv';
import { EmbeddingService } from '../embedding';
import { getAttachmentUrl } from '../../chat/attachment';

export function openAICompletions(
  apiUrl: string,
  apiKey: string,
  type: 'chat' | 'mistral',
  model: string,
  imageSupport?: boolean,
): CompletionService {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  if (type == 'chat' || type == 'mistral') {
    return async function* (context, options) {
      const responseFormat: paths['/chat/completions']['post']['requestBody']['content']['application/json']['response_format'] & {
        schema?: JSONSchemaType<object>;
      } = {
        type: options.jsonMode ? 'json_object' : 'text',
        schema:
          typeof options.jsonMode == 'object' ? options.jsonMode : undefined,
      };
      const body: paths['/chat/completions']['post']['requestBody']['content']['application/json'] & {
        safe_prompt?: boolean;
      } = {
        stream: true,
        model,
        // Convert messages in parallel if there are e.g. image attachments
        messages: await Promise.all(
          context.map((msg) => chatGptMessage(msg, !!imageSupport)),
        ),
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        tools: toolList(options),
        safe_prompt: type == 'mistral' ? false : undefined,
        response_format:
          responseFormat.type != 'text' ? responseFormat : undefined,
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
          // Probably an error, better log it and stop now
          console.error(line);
          throw new Error(`openai api error: ${line}`);
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

async function chatGptMessage(
  message: Message,
  imageSupport: boolean,
): Promise<components['schemas']['ChatCompletionRequestMessage']> {
  if (message.type == 'system') {
    return {
      role: 'system',
      content: extractText(message),
    };
  } else if (message.type == 'bot') {
    return {
      role: 'assistant',
      content: extractText(message),
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
      content: extractText(message),
      tool_call_id: message.callId,
    };
  } else if (message.type == 'user') {
    if (imageSupport) {
      return {
        role: 'user',
        content: await Promise.all(message.parts.map(chatGptPart)),
      };
    } else {
      return {
        role: 'user',
        content: extractText(message),
      };
    }
  } else {
    throw new Error('unknown message type');
  }
}

async function chatGptPart(
  part: MessagePart,
): Promise<components['schemas']['ChatCompletionRequestMessageContentPart']> {
  if (part.type == 'text') {
    return { type: 'text', text: part.text };
  } else if (part.type == 'image') {
    return {
      type: 'image_url',
      image_url: {
        url: await getAttachmentUrl(part.objectId),
      },
    };
  } else {
    throw new Error();
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

export function openAIEmbeddings(
  apiUrl: string,
  apiKey: string,
  model: string,
): EmbeddingService {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  return async (text) => {
    const body: paths['/embeddings']['post']['requestBody']['content']['application/json'] =
      {
        input: text,
        model,
      };
    const response = await fetch(`${apiUrl}/embeddings`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers,
    });
    const reply =
      (await response.json()) as paths['/embeddings']['post']['responses']['200']['content']['application/json'];
    return reply.data[0].embedding;
  };
}
