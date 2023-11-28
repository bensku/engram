import { Message } from '../service/message';
import { ChatEngine } from './engine';

interface BaseEngineOption<T> {
  id: string;
  type: string;
  title: string;
  defaultValue: T;
  userEditable?: boolean;
}

interface UnknownOption<T> extends BaseEngineOption<T> {
  type: 'unknown';
  userEditable?: false;
}

interface SelectOption extends BaseEngineOption<string> {
  type: 'select';
  choices?: { value: string; title: string }[];
}

export interface ToggleOption extends BaseEngineOption<boolean> {
  type: 'toggle';
}

interface SliderOption extends BaseEngineOption<number> {
  type: 'slider';
  start?: number;
  end?: number;
}

export type EngineOption =
  | UnknownOption<unknown>
  | SelectOption
  | ToggleOption
  | SliderOption;

export class OptionType<T extends EngineOption> {
  constructor(
    public readonly type: T['type'],
    public readonly id: string,
    public readonly title: string,
  ) {}

  create(props: Omit<Omit<Omit<T, 'id'>, 'type'>, 'title'>): T {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      ...props,
    } as T;
  }

  get(
    engine: ChatEngine,
    overrides: Record<string, unknown>,
  ): T['defaultValue'] | undefined {
    const option = this.findOption(engine.options, this.id);
    if (!option) {
      return;
    }
    if (option.userEditable) {
      return (overrides[this.id] as T['defaultValue']) ?? option.defaultValue;
    }
    return option.defaultValue;
  }

  getOrThrow(
    engine: ChatEngine,
    overrides: Record<string, unknown>,
  ): T['defaultValue'] {
    const opt = this.get(engine, overrides);
    if (!opt) {
      throw new Error(`missing mandatory option ${this.id}`);
    }
    return opt;
  }

  private findOption(list: EngineOption[], id: string) {
    for (const opt of list) {
      if (opt.id == id) {
        return opt;
      }
    }
    return undefined;
  }
}

export const MODEL = new OptionType<SelectOption>(
  'select',
  'model',
  'Chat model',
);

export const PROMPT = new OptionType<UnknownOption<Message[]>>(
  'unknown',
  'prompt',
  'Prompt',
);

export const TEMPERATURE = new OptionType<SliderOption>(
  'slider',
  'temperature',
  'Temperature',
);

export const SPEECH_MODE = new OptionType<ToggleOption>(
  'toggle',
  'speech-mode',
  'Speech mode',
);

// TODO unused for now
export const SPEECH_VOICE = new OptionType<UnknownOption<string>>(
  'unknown',
  'speech-voice',
  'Speech voice',
);
