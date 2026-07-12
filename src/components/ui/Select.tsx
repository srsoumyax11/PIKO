
interface Option {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Option[] | readonly string[];
  value: string;
  onChangeValue: (val: string) => void;
}

const INP: React.CSSProperties = {
  width: "100%", padding: "8px 12px",
  border: "1px solid var(--line)", borderRadius: "var(--radius-s)",
  fontFamily: "'Inter', sans-serif", backgroundColor: "var(--paper)",
  boxSizing: "border-box"
};

export function Select({ label, options, value, onChangeValue, style, ...props }: SelectProps) {
  return (
    <div>
      <label className="panel-section-label" style={{ fontSize: "11px", marginBottom: "6px", display: "block" }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChangeValue(e.target.value)}
        style={{ ...INP, ...style }}
        {...props}
      >
        {options.map((opt) => {
          if (typeof opt === "string") {
            return <option key={opt} value={opt}>{opt}</option>;
          }
          return <option key={opt.value} value={opt.value}>{opt.label}</option>;
        })}
      </select>
    </div>
  );
}
