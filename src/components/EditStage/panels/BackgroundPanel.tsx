import type { PhotoItem } from "../../../types/photo";
import { BACKGROUND_COLORS } from "../../../lib/constants";
import { Button } from "../../ui/Button";
import { ColorPicker } from "../../ui/ColorPicker";

interface BackgroundPanelProps {
  photo: PhotoItem;
  updatePhoto: (id: string, updates: Partial<PhotoItem>) => void;
  isRemovingBg: boolean;
  handleRemoveBg: () => void;
  handleCancelBg: () => void;
  handleRestoreBg: () => void;
  handleReapplyBg: () => void;
}

export function BackgroundPanel({ 
  photo, updatePhoto, isRemovingBg, handleRemoveBg, handleCancelBg, handleRestoreBg, handleReapplyBg 
}: BackgroundPanelProps) {
  return (
    <div>
      <p className="panel-copy">
        Use AI to remove the background automatically.<br/>
        <span style={{ opacity: 0.7, fontSize: "10px", marginTop: "4px", display: "inline-block" }}>
          (A ~40MB AI model will download on your first use. It will be cached securely for instant offline use afterwards.)
        </span>
      </p>
      <div style={{ marginBottom: "24px" }}>
        {isRemovingBg ? (
          <Button variant="primary" style={{ backgroundColor: "var(--steel)", borderColor: "var(--steel)" }} fullWidth onClick={handleCancelBg}>
            ✕ Cancel
          </Button>
        ) : photo.bgRemovedDataUrl && photo.bgRemoved ? (
          <div style={{ display: "flex", gap: "8px" }}>
            <Button variant="ghost" style={{ flex: 1 }} onClick={handleRestoreBg}>↩ Restore BG</Button>
            <Button variant="primary" style={{ flex: 1 }} onClick={handleRemoveBg}>⟳ Redo AI</Button>
          </div>
        ) : photo.bgRemovedDataUrl && !photo.bgRemoved ? (
          <div style={{ display: "flex", gap: "8px" }}>
            <Button variant="primary" style={{ flex: 1 }} onClick={handleReapplyBg}>✓ Apply</Button>
            <Button variant="ghost" style={{ flex: 1 }} onClick={handleRemoveBg}>⟳ Redo AI</Button>
          </div>
        ) : (
          <Button variant="ghost" fullWidth onClick={handleRemoveBg}>
            ✦ Remove Background
          </Button>
        )}
      </div>

      <p className="panel-section-label">Background Color</p>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
        {BACKGROUND_COLORS.map(c => (
          <div key={c.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <div 
              onClick={() => updatePhoto(photo.id, { bgColor: c.value })} 
              style={{
                width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer",
                backgroundColor: c.value === "transparent" ? "transparent" : c.value,
                border: `2px solid ${(photo.bgColor || "#ffffff") === c.value ? "var(--focus)" : "var(--line)"}`,
                backgroundImage: c.value === "transparent" ? "radial-gradient(var(--line) 1px,transparent 1px)" : "none",
                backgroundSize:  c.value === "transparent" ? "4px 4px" : "auto",
              }} 
            />
            <span style={{ fontSize: "10px", color: "var(--steel)" }}>{c.name}</span>
          </div>
        ))}
      </div>

      <ColorPicker 
        label="Custom Color" 
        value={photo.bgColor && !BACKGROUND_COLORS.find(c => c.value === photo.bgColor) && photo.bgColor !== "transparent" ? photo.bgColor : "#ffffff"}
        onChange={(val) => updatePhoto(photo.id, { bgColor: val })}
        allowTransparent={true}
        hidePresets={true}
      />
    </div>
  );
}
