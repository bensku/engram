import { Message, PostMessageRequest } from '../service/message';
import { TopicOptions } from '../service/topic';
import { appendContext, topicContext } from './context';
import { getEngine } from './engine';
import { generateReply, ReplyStream } from './reply';

export async function handleMessage(
  topicId: number,
  request: PostMessageRequest,
  stream: ReplyStream,
  options: TopicOptions,
) {
  const engine = getEngine(options.engine);
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
  stream.start(message, engine.model, Date.now());

  const context = await topicContext(topicId, engine);
  context.push(message); // TODO remove once the storage actually works

  // Stream reply back to user (and save it once it has been completed)
  const reply = await generateReply(stream, context, engine);
  reply.id = await appendContext(topicId, reply);
  stream.close(reply.id);
}
