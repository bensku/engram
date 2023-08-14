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
    <div class="topic-options">
      <SelectField
        name="Chat engine"
        options={availableEngines}
        value={engine}
        onChange={setEngine}
      />
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
