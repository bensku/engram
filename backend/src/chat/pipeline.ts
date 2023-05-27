import { RedisMessageStorage } from '../service/impl/redis';
import {
  Message,
  MessageStorage,
  PostMessageRequest,
} from '../service/message';
import { appendContext, fullContext, topicContext } from './context';
import { TopicOptions } from './options';
import { generateReply, ReplyStream } from './reply';

export async function handleMessage(
  topicId: number,
  request: PostMessageRequest,
  stream: ReplyStream,
) {
  const options: TopicOptions = {
    model: 'openai:gpt-3.5-turbo',
    prompt: 'assistant',
  };
  // TODO overrides

  // Fill in missing details to user message
  const message: Message = {
    type: 'user',
    id: -1,
    text: request.message,
    time: Date.now(),
  };
  message.id = await appendContext(topicId, message);

  // Send them back to the user, along with other information
  stream.start(message, options.model, Date.now());

  const context = await topicContext(topicId, options);
  context.push(message); // TODO remove once the storage actually works

  // Stream reply back to user (and save it once it has been completed)
  const reply = await generateReply(stream, context, options);
  reply.id = await appendContext(topicId, reply);
  stream.close(reply.id);
}
