import type { PhotoItem, PhotoCaption, CaptionPosition } from "../../../types/photo";
import { FONT_FAMILIES, CAPTION_POSITIONS } from "../../../lib/constants";
import { Select } from "../../ui/Select";
import { Button } from "../../ui/Button";
import { ColorPicker } from "../../ui/ColorPicker";

interface CaptionPanelProps {
  photo: PhotoItem;
  updatePhoto: (id: string, updates: Partial<PhotoItem>) => void;
}

const INP: React.CSSProperties = {
  width: "100%", padding: "8px 12px",
  border: "1px solid var(--line)", borderRadius: "var(--radius-s)",
  fontFamily: "'Inter', sans-serif", backgroundColor: "var(--paper)",
  boxSizing: "border-box"
};

export function CaptionPanel({ photo, updatePhoto }: CaptionPanelProps) {
  const cap = photo.caption ?? {
    text: "", fontSize: 8, fontFamily: "Arial", color: "#ffffff",
    bgColor: "#00000080", position: "overlay-bottom" as CaptionPosition, bold: false, align: "center" as const,
  };

  const upd = (u: Partial<PhotoCaption>) => updatePhoto(photo.id, { caption: { ...cap, ...u } });

  return (
    <div>
      <p className="panel-copy">Add a name, date, or label to the photo.</p>

      <div style={{ marginBottom: "16px" }}>
        <label className="panel-section-label" style={{ fontSize: "11px", marginBottom: "6px", display: "block" }}>
          Caption Text
        </label>
        <input
          type="text"
          value={cap.text}
          placeholder="e.g. Rahul Sharma"
          onChange={e => upd({ text: e.target.value })}
          style={{ ...INP, fontSize: "14px" }}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <Select
          label="Position"
          value={cap.position}
          options={CAPTION_POSITIONS}
          onChangeValue={(val) => upd({ position: val as CaptionPosition })}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
        <div>
          <Select
            label="Font"
            value={cap.fontFamily}
            options={FONT_FAMILIES}
            onChangeValue={(val) => upd({ fontFamily: val })}
            style={{ padding: "8px" }}
          />
        </div>
        <div>
          <label className="panel-section-label" style={{ fontSize: "11px", marginBottom: "6px", display: "block" }}>
            Size (pt)
          </label>
          <input
            type="number" min={6} max={24} step={0.5}
            value={cap.fontSize}
            onChange={e => upd({ fontSize: Number(e.target.value) })}
            style={{ ...INP, padding: "8px" }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
        <ColorPicker
          label="Text Color"
          value={cap.color}
          onChange={(val) => upd({ color: val })}
        />
        <ColorPicker
          label="Bar Color"
          value={cap.bgColor}
          allowTransparent={true}
          onChange={(val) => upd({ bgColor: val })}
        />
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {(["left", "center", "right"] as const).map(a => (
          <Button
            key={a}
            variant={cap.align === a ? "primary" : "ghost"}
            onClick={() => upd({ align: a })}
            style={{ flex: 1 }}
          >
            {a === "left" ? "⬅" : a === "center" ? "↔" : "➡"}
          </Button>
        ))}
        <Button
          variant={cap.bold ? "primary" : "ghost"}
          onClick={() => upd({ bold: !cap.bold })}
          style={{ flex: 1, fontWeight: "bold" }}
        >
          B
        </Button>
      </div>

      {cap.text && (
        <Button variant="ghost" fullWidth style={{ color: "var(--danger,#e81c4f)" }} onClick={() => updatePhoto(photo.id, { caption: undefined })}>
          Remove Caption
        </Button>
      )}
    </div>
  );
}
