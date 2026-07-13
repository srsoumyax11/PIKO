import { Slider } from "./Slider";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  allowTransparent?: boolean;
  hidePresets?: boolean;
}

function parseColor(val: string) {
  if (val === "transparent") return { hex: "#000000", a: 0 };
  if (val.startsWith("#")) {
    const hex = val.slice(0, 7);
    const aHex = val.slice(7, 9);
    const a = aHex ? parseInt(aHex, 16) / 255 : 1;
    return { hex: hex.padEnd(7, "0"), a: Math.round(a * 100) };
  }
  return { hex: "#ffffff", a: 100 };
}

function formatColor(hex: string, a: number) {
  if (a === 0) return "transparent";
  if (a === 100) return hex;
  const alphaHex = Math.round((a / 100) * 255).toString(16).padStart(2, "0");
  return `${hex}${alphaHex}`;
}

export function ColorPicker({ label, value, onChange, allowTransparent, hidePresets }: ColorPickerProps) {
  const { hex, a } = parseColor(value);
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
            value={hex} 
            onChange={(e) => onChange(formatColor(e.target.value, a))} 
            style={{ 
              position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%"
            }} 
            title="Custom Color"
          />
        </div>
      </div>
      
      {!isTransparent && (
        <div style={{ marginTop: "12px" }}>
          <Slider
            label="Opacity"
            value={a}
            min={0}
            max={100}
            step={1}
            unit="%"
            onChange={(newA) => onChange(formatColor(hex, newA))}
          />
        </div>
      )}
    </div>
  );
}
