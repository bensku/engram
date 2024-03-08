import Ajv, { JSONSchemaType } from 'ajv';
import { batchCompletionsForModel } from '../service/completion';
import { Message, message } from '../service/message';

type Analyzer<T> = (text: string) => Promise<T>;

/**
 * Creates a new analyzer that performs the specified task on inputs given to it.
 * @param model LLM to be used; requires JSON mode with schema support.
 * @param task Task that the analyzer should perform.
 * @param replyFormat Reply format as a JSON schema type. Hint:
 * use enums if you want to restrict the reply certain options!
 * @returns A new analyzer.
 */
export function newAnalyzer<T extends object>(
  model: string,
  task: string,
  replyFormat: JSONSchemaType<T>,
): Analyzer<T> {
  const completions = batchCompletionsForModel(model);
  return async (text) => {
    const context: Message[] = [
      message(
        'system',
        'You are a precise assistant that provides responses in JSON.',
      ),
      message('user', `${text}\n---\n${task}`),
    ];
    const reply = await completions(context, {
      temperature: 0,
      maxTokens: 100,
      jsonMode: replyFormat as JSONSchemaType<object>, // FIXME should not need cast, tsoa bug?
    });
    let json: T;
    try {
      json = JSON.parse(reply) as T;
    } catch (e) {
      console.error('Invalid JSON:', reply);
      throw e;
    }
    if (!ajv.validate(replyFormat, json)) {
      console.error(json);
      throw new Error(); // TODO handle this without crashing
    }
    return json;
  };
}

const ajv = new Ajv();
