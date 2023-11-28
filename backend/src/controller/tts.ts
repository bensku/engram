import { PassThrough } from 'stream';
import { Get, Path, Route, Security, Controller } from 'tsoa';
import { openAITts } from '../service/impl/openai';

const TTS = process.env.OPENAI_API_KEY
  ? openAITts(process.env.OPENAI_API_KEY, 'tts-1')
  : null;

@Route('tts')
export class TtsController extends Controller {
  @Security('auth')
  @Get('{text}')
  speak(@Path() text: string): Promise<unknown> {
    this.setHeader('Content-Type', 'audio/opus');
    const stream = new PassThrough();

    if (!TTS) {
      throw new Error('tts is not available');
    }
    void (async () => {
      for await (const data of TTS(text, 'alloy')) {
        stream.write(data);
      }
      stream.end();
    })();

    return Promise.resolve(stream);
  }
}
