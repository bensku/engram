export const TopicOptions = ({
  availableEngines,
  engine,
  setEngine,
}: {
  availableEngines: ChatEngine[];
  engine: string;
  setEngine: (id: string) => void;
}) => {
  return (
    <article class="max topic-options">
      <h6 class="center-align">Topic options</h6>
      <EngineSelection
        options={availableEngines}
        value={engine}
        onChange={setEngine}
      />
      {/* <SelectField
        name="Chat engine"
        options={availableEngines}
        value={engine}
        onChange={setEngine}
      /> */}
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
    <div class="field vertical">
      {options.map((opt) => (
        <label class="radio" key={opt.id}>
          <input
            type="radio"
            name="engine"
            checked={opt.id == value ? true : undefined}
            onClick={() => onChange(opt.id)}
          />
          <span>{opt.name}</span>
        </label>
      ))}
    </div>
  );
};

const SelectField = ({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: ChatEngine[];
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
            key={opt.id}
            value={opt.id}
            selected={opt.id == value ? true : undefined}
          >
            {opt.name}
          </option>
        ))}
      </select>
      <label class="active">{name}</label>
      <i>arrow_drop_down</i>
    </div>
  );
};

interface ChatEngine {
  id: string;
  name: string;
}
