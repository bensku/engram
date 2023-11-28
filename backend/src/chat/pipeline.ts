import { openAITranscriptions } from '../service/impl/openai';
import { Message, PostMessageRequest } from '../service/message';
import { TopicOptions } from '../service/topic';
import { TranscriptionService } from '../service/transcription';
import { checkToolUsage, invokeTool } from '../tool/call';
import { appendContext, topicContext } from './context';
import { getEngine } from './engine';
import { MODEL, SPEECH_MODE } from './options';
import { generateReply, ReplyStream } from './reply';
import { generateTitle, updateTitle } from './title-gen';

const transcribe: TranscriptionService | null = process.env.OPENAI_API_KEY
  ? openAITranscriptions(process.env.OPENAI_API_KEY, 'canary-whisper')
  : null;

export async function handleMessage(
  topicId: number,
  request: PostMessageRequest,
  stream: ReplyStream,
  options: TopicOptions,
) {
  let text = request.message;
  if (request.format == 'speech') {
    if (!transcribe) {
      throw new Error('transcriptions unavailable, missing OPENAI_API_KEY');
    }
    // Spoken message received; transcribe it
    const audio = Buffer.from(request.message, 'binary');
    text = await transcribe(audio, 'en');

    // Enable voice mode for reply generation (model will generate something shorter)
    options.options[SPEECH_MODE.id] = true;
  }

  const engine = getEngine(options.engine);

  // Fill in missing details to user message
  const message: Message = {
    type: 'user',
    id: -1,
    text,
    time: Date.now(),
  };
  message.id = await appendContext(topicId, message);

  // Send them back to the user, along with other information
  stream.start(message, MODEL.getOrThrow(engine, options.options), Date.now());

  const context = await topicContext(topicId, engine, options);

  // Stream reply back to user (and save it once it has been completed)
  for (;;) {
    // Generate reply and stream it back to user if it includes text
    const reply = await generateReply(stream, context, engine, options);
    context.push(reply);
    reply.id = await appendContext(topicId, reply);

    // If tools need to be called, call them
    if (reply.type == 'bot' && reply.toolCalls) {
      // End the current reply before sending tool message to user
      // Otherwise, the messages might be in wrong order
      stream.start(null, MODEL.getOrThrow(engine, options.options), Date.now());

      for (const call of reply.toolCalls) {
        // Check LLM-generated arguments
        const request = await checkToolUsage(call);
        if ('error' in request) {
          // TODO error handling
          console.error(request.error);
        } else {
          // TODO support for asking user confirmation
          stream.sendFragment({
            type: 'toolCall',
            tool: call.tool,
            text: request.callTitle,
          });
        }

        // Call the tool
        const result = await invokeTool(call);
        if ('error' in result) {
          // TODO error handling
          console.error(result.error);
        } else {
          const toolMsg: Message = {
            id: -1,
            type: 'tool',
            text: result.message,
            tool: call.tool,
            callId: call.id,
            time: Date.now(),
          };
          context.push(toolMsg);
          toolMsg.id = await appendContext(topicId, toolMsg);
          stream.sendFragment({
            type: 'toolCallCompleted',
            tool: call.tool,
            text: toolMsg.text,
          });
        }
      }
    } else {
      break; // No more tool calls to do; stop generation for user input
    } // else: allow LLM to reply to the tool messages
  }

  // If the topic lacks a title, give it AI-generated one and stream that back too
  if (!options.title) {
    const title = await generateTitle(context);
    stream.sendFragment({ type: 'title', title });
    await updateTitle(topicId, title);
  }

  stream.close(context[context.length - 1].id);
}
