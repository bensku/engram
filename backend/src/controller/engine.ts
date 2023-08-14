import { Controller, Get, Route, Security } from 'tsoa';
import { listEngines } from '../chat/engine';

@Route('engine')
export class EngineController extends Controller {
  @Security('auth')
  @Get('')
  engines(): Promise<Engine[]> {
    return Promise.resolve(
      listEngines().map((engine) => ({
        id: engine.id,
        name: engine.name,
      })),
    );
  }
}

export interface Engine {
  id: string;
  name: string;
}
