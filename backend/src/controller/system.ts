import { Controller, Get, Route } from 'tsoa';

@Route('system')
export class SystemController extends Controller {
  @Get('/health')
  public health(): Promise<string> {
    return Promise.resolve('OK');
  }
}
