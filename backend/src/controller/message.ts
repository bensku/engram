import { Body, Controller, Get, Path, Post, Route } from 'tsoa';
import { fullContext } from '../chat/context';
import { handleMessage } from '../chat/pipeline';
import { ReplyStream } from '../chat/reply';
import { Message } from '../service/message';

@Route('message')
export class MessageController extends Controller {
  @Get('{topicId}')
  async messages(@Path() topicId: string): Promise<Message[]> {
    return fullContext(topicId);
  }

  @Post('{topicId}')
  async postAndGetReply(
    @Path() topicId: string,
    @Body() message: string,
  ): Promise<unknown> {
    // PassThrough is not valid return type; OpenAPI doesn't really handle SSE
    const stream = new ReplyStream();
    void handleMessage(topicId, message, stream);
    return Promise.resolve(stream.nodeStream);
  }
}
