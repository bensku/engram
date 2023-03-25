import { randomUUID } from 'crypto';
import { Message } from '../service/message';
import { appendContext, topicContext } from './context';
import { TopicOptions } from './options';
import { generateReply, ReplyStream } from './reply';

export async function handleMessage(
  topicId: string,
  message: string,
  stream: ReplyStream,
) {
  const options: TopicOptions = {
    model: 'openai:gpt-3.5-turbo',
    prompt: 'assistant',
  };

  const userMessage: Message = {
    type: 'user',
    id: randomUUID(),
    text: message,
  };

  // Stream reply back to user (and save it once it has been completed)
  const context = [...(await topicContext(topicId, options)), userMessage];
  const reply = await generateReply(stream, context, options);
  console.log(reply);

  // Save both user and bot messages
  void appendContext(topicId, userMessage, reply);
}
