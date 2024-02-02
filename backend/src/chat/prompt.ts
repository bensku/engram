import { Message } from '../service/message';
import { TopicOptions } from '../service/topic';
import { ChatEngine } from './engine';
import { MODEL, OptionType, SelectOption } from './options';
import { GenerateCallback, GenerateContext } from './pipeline';

export type Prompt = Record<string, PromptOption> & { default: PromptOption };
type PromptOption =
  | [string, string?]
  | ((engine: ChatEngine, options: TopicOptions) => [string, string?]);

export function replacePlaceholderWithOption(
  placeholder: string,
  optionType: OptionType<SelectOption>,
): GenerateCallback {
  return (ctx) => {
    const value = optionType.get(ctx);
    if (value) {
      ctx.context[0].text = ctx.context[0].text?.replaceAll(placeholder, value);
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
  const msgs: Message[] = [
    { type: 'system', id: -2, text: option[0], time: Date.now() },
  ];
  if (option[1]) {
    msgs.push({ type: 'user', id: -1, text: option[1], time: Date.now() });
  }
  return msgs;
}
