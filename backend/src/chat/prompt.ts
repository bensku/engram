import { Message, message } from '../service/message';
import { TopicOptions } from '../service/topic';
import { ChatEngine } from './engine';
import { MODEL, OptionType, SelectOption } from './options';
import { GenerateCallback, GenerateContext } from './pipeline';

export type Prompt = Record<string, PromptOption> & { default: PromptOption };
type PromptOption =
  | [string, string?]
  | ((engine: ChatEngine, options: TopicOptions) => [string, string?]);

/**
 * Creates a generation callback that replaces the given placeholder text with
 * value of an option.
 * @param placeholder Placeholder text. This is used as-is for replaceAll().
 * @param optionType Option type.
 * @returns Generation callback.
 */
export function replacePlaceholderWithOption(
  placeholder: string,
  optionType: OptionType<SelectOption>,
): GenerateCallback {
  return (ctx) => {
    const value = optionType.get(ctx);
    if (value) {
      for (const part of ctx.context[0].parts) {
        if (part.type == 'text') {
          part.text = part.text.replace(placeholder, value);
        }
      }
    }
  };
}

export function promptMessages(
  prompt: Prompt,
  ctx: GenerateContext,
): Message[] {
  let option = prompt[MODEL.getOrThrow(ctx)];
  if (!option) {
    // No model-specific prompt; pick the default one
    option = prompt.default;
  }
  if (!Array.isArray(option)) {
    // If prompt is a function, execute it!
    option = option(ctx.engine, ctx.topic);
  }

  // Convert prompt to messages
  const msgs: Message[] = [message('system', option[0])];
  if (option[1]) {
    msgs.push(message('user', option[1]));
  }
  return msgs;
}
