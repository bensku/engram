import { Controller, Get, Route, Security } from 'tsoa';
import { ChatEngine, listEngines } from '../chat/engine';

@Route('engine')
export class EngineController extends Controller {
  @Security('auth')
  @Get('')
  engines(): Promise<Omit<ChatEngine, 'preHandlers'>[]> {
    return Promise.resolve(
      listEngines().map((engine) => ({
        id: engine.id,
        name: engine.name,
        options: engine.options.filter((opt) => opt.userEditable),
      })),
    );
  }
}
