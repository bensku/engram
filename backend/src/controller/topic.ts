import { Body, Controller, Get, Path, Post, Route } from 'tsoa';

interface Topic {
  id: string;
  language: string;
}

type TopicParams = Pick<Topic, 'language'>;

@Route('topic')
export class TopicController extends Controller {
  @Get('')
  async topics(): Promise<Topic[]> {
    return [];
  }

  @Get('{id}')
  async topic(@Path() id: string): Promise<Topic> {
    return {
      id: '',
      language: '',
    };
  }

  @Post('')
  async newTopic(@Body() params: TopicParams): Promise<void> {}
}
