interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  allowTransparent?: boolean;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const isTransparent = value === "transparent";

  return (
    <div>
      <label className="panel-section-label" style={{ fontSize: "11px", marginBottom: "6px", display: "block" }}>
        {label}
      </label>
      <input 
        type="color" 
        value={isTransparent ? "#000000" : value} 
        onChange={(e) => onChange(e.target.value)} 
        style={{ 
          width: "100%", 
          height: "36px", 
          border: "1px solid var(--line)", 
          borderRadius: "var(--radius-s)", 
          cursor: "pointer",
          padding: 0
        }} 
      />
    </div>
  );
}
