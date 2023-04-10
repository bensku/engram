import { Body, Controller, Get, Path, Post, Route } from 'tsoa';

interface Topic {
  id: string;
  title: string;
}

type TopicParams = Partial<Topic>;

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
      title: '',
    };
  }

  @Post('')
  async newTopic(@Body() params: TopicParams): Promise<Topic> {
    return {
      id: '',
      title: '',
    };
  }
}
