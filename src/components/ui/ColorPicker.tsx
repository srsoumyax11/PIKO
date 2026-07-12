interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  allowTransparent?: boolean;
  hidePresets?: boolean;
}

export function ColorPicker({ label, value, onChange, allowTransparent, hidePresets }: ColorPickerProps) {
  const isTransparent = value === "transparent";

  const presets = [
    { name: "Black", value: "#000000" },
    { name: "White", value: "#ffffff" },
  ];
  if (allowTransparent) {
    presets.push({ name: "Clear", value: "transparent" });
  }

  const isCustom = !presets.find(p => p.value === value) && value !== "transparent";

  return (
    <div>
      <label className="panel-section-label" style={{ fontSize: "11px", marginBottom: "6px", display: "block" }}>
        {label}
      </label>
      
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
        {!hidePresets && presets.map(c => (
          <div 
            key={c.name}
            title={c.name}
            onClick={() => onChange(c.value)}
            style={{
              width: "24px", height: "24px", borderRadius: "50%", cursor: "pointer",
              backgroundColor: c.value === "transparent" ? "transparent" : c.value,
              border: `2px solid ${value === c.value ? "var(--focus)" : "var(--line)"}`,
              backgroundImage: c.value === "transparent" ? "radial-gradient(var(--line) 1px,transparent 1px)" : "none",
              backgroundSize:  c.value === "transparent" ? "4px 4px" : "auto",
            }}
          />
        ))}
        
        {/* Custom Color Input */}
        <div style={{ position: "relative", width: "24px", height: "24px" }}>
          <div 
            style={{
              position: "absolute", inset: 0, borderRadius: "50%", cursor: "pointer",
              backgroundColor: isCustom ? value : "conic-gradient(red, yellow, green, cyan, blue, magenta, red)",
              backgroundImage: isCustom ? "none" : "conic-gradient(red, yellow, green, cyan, blue, magenta, red)",
              border: `2px solid ${isCustom ? "var(--focus)" : "var(--line)"}`,
            }}
          />
          <input 
            type="color" 
            value={isTransparent ? "#000000" : value} 
            onChange={(e) => onChange(e.target.value)} 
            style={{ 
              position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%"
            }} 
            title="Custom Color"
          />
        </div>
      </div>
    </div>
  );
}
