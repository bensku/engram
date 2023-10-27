import { Message, PostMessageRequest } from '../service/message';
import { TopicOptions } from '../service/topic';
import { appendContext, topicContext } from './context';
import { getEngine } from './engine';
import { MODEL } from './options';
import { generateReply, ReplyStream } from './reply';
import { generateTitle, updateTitle } from './title-gen';

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
  stream.start(message, MODEL.getOrThrow(engine, options.options), Date.now());

  const context = await topicContext(topicId, engine);
  context.push(message); // TODO remove once the storage actually works

  // Stream reply back to user (and save it once it has been completed)
  const reply = await generateReply(stream, context, engine, options);
  context.push(reply);
  reply.id = await appendContext(topicId, reply);

  // If the topic lacks a title, give it AI-generated one and stream that back too
  if (!options.title) {
    const title = await generateTitle(context);
    stream.sendFragment({ type: 'title', title });
    await updateTitle(topicId, title);
  }

  stream.close(reply.id);
}
