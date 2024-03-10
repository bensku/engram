import { Controller, Get, Route, Security } from 'tsoa';
import { getAttachment, getAttachmentUrl } from '../chat/attachment';

@Route('attachment')
export class AttachmentController extends Controller {
  @Security('auth')
  @Get('/{objectId}')
  async getAttachment(objectId: string): Promise<Uint8Array | null> {
    if (USE_REDIRECTS) {
      const url = await getAttachmentUrl(objectId);
      this.setHeader('Location', url);
      return null;
    } else {
      const obj = await getAttachment(objectId);
      return obj.data;
    }
  }
}

const USE_REDIRECTS = false; // TODO revisit when/if S3 based storage is implemented
