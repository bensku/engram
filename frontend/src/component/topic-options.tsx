import { useEffect, useState } from 'preact/hooks';
import { debounce } from '../debounce';
import { currentTopic, engineMap, engines, speechInputEnabled } from '../state';
import { responses } from '../types';

export const TopicOptions = ({
  updateTopic,
}: {
  updateTopic: (
    topic: Partial<responses['Topic']>,
    updateServer: 'if-exists',
  ) => Promise<number>;
}) => {
  const engineOpts = engineMap.value.get(
    currentTopic.value.engine ?? 'default',
  )?.options;
  const overrides = currentTopic.value.options ?? {};
  return (
    <article class="max tiny-margin no-round topic-options vertical">
      <h6 class="center-align">Topic options</h6>
      <EngineSelection
        options={engines.value}
        value={currentTopic.value.engine ?? 'default'}
        onChange={(newEngine) =>
          void updateTopic({ engine: newEngine }, 'if-exists')
        }
      />
      {engineOpts?.map((opt) => (
        <EngineOption
          key={opt.id}
          option={opt}
          value={overrides[opt.id] ?? opt.defaultValue}
          setValue={(value) =>
            void updateTopic(
              {
                options: {
                  ...currentTopic.value.options,
                  [opt.id]: value,
                } as Record<string, unknown>,
              },
              'if-exists',
            )
          }
        />
      ))}
      <label class="switch">
        <input
          type="checkbox"
          value={speechInputEnabled.value ? 'true' : 'false'}
          onClick={() => (speechInputEnabled.value = !speechInputEnabled.value)}
        />
        <span class="small-padding">Voice input</span>
      </label>
    </article>
  );
};

const EngineSelection = ({
  options,
  value,
  onChange,
}: {
  options: ChatEngine[];
  value: string;
  onChange: (newValue: string) => void;
}) => {
  return (
    <div class="grid no-space">
      {options.map((opt) => (
        <a
          class={'no-margin s6 chip' + (opt.id != value ? ' border' : ' fill')}
          key={opt.id}
          onClick={() => onChange(opt.id)}
        >
          {opt.name}
        </a>
      ))}
    </div>
  );
};

const EngineOption = ({
  option,
  value,
  setValue,
}: {
  option: responses['EngineOption'];
  value: unknown;
  setValue: (value: unknown) => void;
}) => {
  if (option.type == 'select') {
    return (
      <SelectField
        name={option.title}
        options={option.choices ?? []}
        value={value as string}
        onChange={setValue}
      />
    );
  } else if (option.type == 'slider') {
    return (
      <SliderField
        name={option.title}
        min={option.start ?? 0}
        max={option.end ?? 1}
        value={value as number}
        onChange={setValue}
      />
    );
  } else if (option.type == 'toggle') {
    return (
      <ToggleField
        name={option.title}
        value={value as boolean}
        onChange={setValue}
      />
    );
  } else {
    return null;
  }
};

const SelectField = ({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: { title: string; value: string }[];
  value: string;
  onChange: (newValue: string) => void;
}) => {
  return (
    <div class="field label suffix border">
      <select
        class="active"
        onChange={(event) =>
          onChange((event.target as HTMLSelectElement).value)
        }
      >
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            selected={opt.value == value ? true : undefined}
          >
            {opt.title}
          </option>
        ))}
      </select>
      <label class="active">{name}</label>
      <i>arrow_drop_down</i>
    </div>
  );
};

const debounceUpdate = debounce(
  (onChange: (newValue: number) => void, newValue: number) => {
    onChange(newValue);
  },
  200,
);

const SliderField = ({
  name,
  min,
  max,
  value,
  onChange,
}: {
  name: string;
  min: number;
  max: number;
  value: number;
  onChange: (newValue: number) => void;
}) => {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => setCurrentValue(value), [value]);

  const updateValue = (value: number) => {
    debounceUpdate(onChange, value);
    setCurrentValue(value);
  };

  // Preact's Typescript types are sometimes quite incomplete
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const readValue = (event: any): number => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return parseFloat(event.target.value);
  };

  return (
    <div>
      <label>{name}</label>
      <div class="field middle-align no-margin">
        <label class="slider">
          <input
            class="no-margin"
            type="range"
            value={currentValue}
            min={min}
            max={max}
            step={0.01}
            onChange={(event) => updateValue(readValue(event))}
          />
          <span></span>
          <div class="tooltip"></div>
        </label>
      </div>
    </div>
  );
};

const ToggleField = ({
  name,
  value,
  onChange,
}: {
  name: string;
  value: boolean;
  onChange: (newValue: boolean) => void;
}) => {
  return (
    <label class="checkbox">
      <input type="checkbox" checked={value} onClick={() => onChange(!value)} />
      <span>{name}</span>
    </label>
  );
};

interface ChatEngine {
  id: string;
  name: string;
}
