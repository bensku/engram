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
import { deleteMessage, fullContext, updateMessage } from '../chat/context';
import { handleMessage } from '../chat/pipeline';
import { ReplyStream } from '../chat/reply';
import { Message, PostMessageRequest } from '../service/message';
import { RequestBody } from '../types';
import { DbTopicStorage } from '../service/impl/postgres';
import { ForbiddenError } from '../auth';

// TODO this really shouldn't be in this file, but oh well
const storage = new DbTopicStorage();

@Route('message')
export class MessageController extends Controller {
  @Security('auth')
  @Get('{topicId}')
  async messages(
    @Request() req: RequestBody,
    @Path() topicId: number,
  ): Promise<Message[]> {
    // TODO authz, topic owner check
    // Only send messages that have text content to user for now
    return (await fullContext(topicId)).filter((msg) => msg.text);
  }

  @Security('auth')
  @Post('{topicId}')
  async postAndGetReply(
    @Request() req: RequestBody,
    @Path() topicId: number,
    @Body() message: PostMessageRequest,
  ): Promise<unknown> {
    const topic = await storage.get(topicId);
    if (!topic) {
      throw new Error(); // TODO not found
    }
    if (topic.user !== req.user.id) {
      throw new ForbiddenError();
    }

    // PassThrough is not valid return type; OpenAPI doesn't really handle SSE
    const stream = new ReplyStream();
    void handleMessage(topicId, message, stream, topic);
    return Promise.resolve(stream.nodeStream);
  }

  @Security('auth')
  @Put('{messageId}')
  async updateMsg(
    @Request() req: RequestBody,
    @Path() messageId: number,
    @Body() message: PostMessageRequest,
  ): Promise<void> {
    // TODO authz
    await updateMessage(messageId, message.message);
  }

  @Security('auth')
  @Delete('{messageId}')
  async deleteMsg(
    @Request() req: RequestBody,
    @Path() messageId: number,
  ): Promise<void> {
    // TODO authz
    await deleteMessage(messageId);
  }
}
