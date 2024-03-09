import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Put,
  Request,
  Route,
  Security,
} from 'tsoa';
import { DbTopicStorage } from '../service/impl/postgres';
import { Topic, TopicOptions } from '../service/topic';
import { RequestBody } from '../types';
import { deleteMessage, fullContext } from '../chat/context';
import { deleteMessageAttachments } from '../chat/attachment';
import { NotFoundError } from '../error';

const storage = new DbTopicStorage();

@Route('topic')
export class TopicController extends Controller {
  @Security('auth')
  @Get('')
  async topics(@Request() req: RequestBody): Promise<Topic[]> {
    return storage.list(req.user.id);
  }

  @Security('auth')
  @Get('{id}')
  async topic(@Request() req: RequestBody, @Path() id: number): Promise<Topic> {
    return checkTopicAccess(req, id);
  }

  @Security('auth')
  @Post('')
  async newTopic(
    @Request() req: RequestBody,
    @Body() params: Partial<TopicOptions>,
  ): Promise<Topic> {
    const topic = {
      title: params.title ?? '',
      user: req.user.id,
      engine: params.engine ?? 'default',
      options: params.options ?? {},
    };
    return { ...topic, id: await storage.save(topic) };
  }

  @Security('auth')
  @Put('{id}')
  async updateTopic(
    @Request() req: RequestBody,
    @Path() id: number,
    @Body() params: Partial<Omit<Topic, 'id'>>,
  ): Promise<void> {
    await checkTopicAccess(req, id);
    await storage.save({
      id,
      title: params.title,
      engine: params.engine,
      options: params.options,
    });
  }

  @Security('auth')
  @Delete('{id}')
  async deleteTopic(
    @Request() req: RequestBody,
    @Path() id: number,
  ): Promise<void> {
    await checkTopicAccess(req, id);

    // Go through messages; delete them and their attachments
    const messages = await fullContext(id);
    // TODO although going through all messages is needed, they could be deleted in one go
    await Promise.all(
      messages.map((msg) =>
        Promise.all([deleteMessageAttachments(msg), deleteMessage(msg.id)]),
      ),
    );
    await storage.delete(id);
  }
}

export async function checkTopicAccess(
  req: RequestBody,
  topicId: number | undefined,
): Promise<Topic> {
  if (!topicId) {
    console.warn('Could not check access, missing topic id');
    throw new NotFoundError();
  }
  const topic = await storage.get(topicId);
  if (!topic) {
    throw new NotFoundError();
  } else if (topic.user != req.user.id) {
    console.warn(
      'User',
      req.user.id,
      'tried to access topic ',
      topicId,
      'of user',
      topic.user,
    );
    throw new NotFoundError(); // Don't reveal existence of topic!
  }
  return topic;
}
