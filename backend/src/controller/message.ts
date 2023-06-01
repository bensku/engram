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
import { fullContext } from '../chat/context';
import { handleMessage } from '../chat/pipeline';
import { ReplyStream } from '../chat/reply';
import { Message, PostMessageRequest } from '../service/message';
import { RequestBody } from '../types';

@Route('message')
export class MessageController extends Controller {
  @Security('auth')
  @Get('{topicId}')
  async messages(
    @Request() req: RequestBody,
    @Path() topicId: number,
  ): Promise<Message[]> {
    // TODO authz, topic owner check
    return fullContext(topicId);
  }

  @Security('auth')
  @Post('{topicId}')
  async postAndGetReply(
    @Request() req: RequestBody,
    @Path() topicId: number,
    @Body() message: PostMessageRequest,
  ): Promise<unknown> {
    // TODO authz, topic owner check
    // PassThrough is not valid return type; OpenAPI doesn't really handle SSE
    const stream = new ReplyStream();
    void handleMessage(topicId, message, stream);
    return Promise.resolve(stream.nodeStream);
  }
}
