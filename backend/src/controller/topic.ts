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
import { ForbiddenError } from '../auth';
import { DbTopicStorage } from '../service/impl/postgres';
import { Topic } from '../service/topic';
import { RequestBody } from '../types';

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
    const topic = await storage.get(id);
    if (!topic) {
      throw new Error(); // TODO not found
    }
    if (topic.user != req.user.id) {
      throw new ForbiddenError();
    }
    return topic;
  }

  @Security('auth')
  @Post('')
  async newTopic(
    @Request() req: RequestBody,
    @Body() params: Partial<Omit<Omit<Topic, 'id'>, 'user'>>,
  ): Promise<Topic> {
    const topic = {
      title: params.title ?? '',
      user: req.user.id,
      engine: params.engine ?? 'assistant',
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
    if ((await storage.get(id))?.user != req.user.id) {
      throw new ForbiddenError();
    }
    await storage.save({ id, title: params.title, engine: params.engine });
  }

  @Security('auth')
  @Delete('{id}')
  async deleteTopic(
    @Request() req: RequestBody,
    @Path() id: number,
  ): Promise<void> {
    if ((await storage.get(id))?.user != req.user.id) {
      throw new ForbiddenError();
    }
    await storage.delete(id);
  }
}
