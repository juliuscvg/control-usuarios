import { useMemo, useState } from "react";

type Option = {
  value: string;
  label: string;
  description?: string;
};

type MultiSelectProps = {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
};

const MultiSelect = ({ options, value, onChange, placeholder }: MultiSelectProps) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const lower = query.toLowerCase();
    return options.filter((option) =>
      option.label.toLowerCase().includes(lower)
    );
  }, [options, query]);

  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((item) => item !== optionValue));
      return;
    }
    onChange([...value, optionValue]);
  };

  return (
    <div className="multiselect">
      <input
        className="input"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder ?? "Buscar..."}
      />
      <div className="multiselect__list">
        {filtered.map((option) => (
          <label key={option.value} className="multiselect__option">
            <input
              type="checkbox"
              checked={value.includes(option.value)}
              onChange={() => toggle(option.value)}
            />
            <div>
              <div className="multiselect__label">{option.label}</div>
              {option.description && (
                <div className="muted">{option.description}</div>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default MultiSelect;

