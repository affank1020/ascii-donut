type Choice = Readonly<{ value: string; label: string }>;

type ChoiceGroupProps = {
  label: string;
  options: readonly Choice[];
  selected: readonly string[];
  onSelect: (value: string) => void;
  className?: string;
};

export function ChoiceGroup({
  label,
  options,
  selected,
  onSelect,
  className = "",
}: ChoiceGroupProps) {
  return (
    <fieldset className="control-group">
      <legend>{label}</legend>
      <div className={`option-row ${className}`}>
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              className={isSelected ? "option is-selected" : "option"}
              onClick={() => onSelect(option.value)}
              aria-pressed={isSelected}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
