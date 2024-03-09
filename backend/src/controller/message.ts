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
import {
  deleteMessage,
  fullContext,
  getOneMessage,
  updateMessage,
} from '../chat/context';
import { handleMessage } from '../chat/pipeline';
import { ReplyStream } from '../chat/reply';
import { Message, PostMessageRequest, extractText } from '../service/message';
import { RequestBody } from '../types';
import { deleteMessageAttachments } from '../chat/attachment';
import { checkTopicAccess } from './topic';
import { NotFoundError } from '../error';

@Route('message')
export class MessageController extends Controller {
  @Security('auth')
  @Get('{topicId}')
  async messages(
    @Request() req: RequestBody,
    @Path() topicId: number,
  ): Promise<Message[]> {
    await checkTopicAccess(req, topicId);
    // Only send messages that have text content to user for now
    return (await fullContext(topicId)).filter((msg) => extractText(msg));
  }

  @Security('auth')
  @Post('{topicId}')
  async postAndGetReply(
    @Request() req: RequestBody,
    @Path() topicId: number,
    @Body() message: PostMessageRequest,
  ): Promise<unknown> {
    const topic = await checkTopicAccess(req, topicId);

    // PassThrough is not valid return type; OpenAPI doesn't really handle SSE
    const stream = new ReplyStream();
    // Handle errors a bit differently from usual; we have already replied 200 OK to client...
    void handleMessage(topicId, message, stream, topic).catch((e) => {
      stream.sendFragment({
        type: 'userMessage',
        kind: 'error',
        msg: 'Internal server error. This is likely a bug in engram.',
      });
      console.error(e);
    });
    return Promise.resolve(stream.nodeStream);
  }

  @Security('auth')
  @Put('{messageId}')
  async updateMsg(
    @Request() req: RequestBody,
    @Path() messageId: number,
    @Body() message: PostMessageRequest,
  ): Promise<void> {
    const msg = await getOneMessage(messageId);
    await checkTopicAccess(req, msg?.topicId);
    await updateMessage(messageId, [{ type: 'text', text: message.message }]);
  }

  @Security('auth')
  @Delete('{messageId}')
  async deleteMsg(
    @Request() req: RequestBody,
    @Path() messageId: number,
  ): Promise<void> {
    const msg = await getOneMessage(messageId);
    await checkTopicAccess(req, msg?.topicId);
    if (msg) {
      await deleteMessageAttachments(msg);
      await deleteMessage(messageId);
    } else {
      throw new NotFoundError();
    }
  }
}
