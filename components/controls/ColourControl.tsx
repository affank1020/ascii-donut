type ColourControlProps = {
  color: string;
  hex: string;
  onColorChange: (value: string) => void;
  onHexChange: (value: string) => void;
};

export function ColourControl({
  color,
  hex,
  onColorChange,
  onHexChange,
}: ColourControlProps) {
  return (
    <fieldset className="control-group colour-group">
      <legend>Colour</legend>
      <div className="colour-control">
        <input
          className="colour-picker"
          type="color"
          value={color}
          onChange={(event) => onColorChange(event.target.value)}
          aria-label="Shape colour"
        />
        <input
          className="hex-input"
          type="text"
          value={hex}
          onChange={(event) => onHexChange(event.target.value)}
          maxLength={7}
          spellCheck={false}
          aria-label="Shape colour hex value"
        />
      </div>
    </fieldset>
  );
}
