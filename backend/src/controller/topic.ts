import {
  Body,
  Controller,
  Get,
  Path,
  Post,
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
    // Allow the client set title, but NOT user id or topic id
    const topic = { title: '', ...params, user: req.user.id };
    return { ...topic, id: await storage.save(topic) };
  }
}
