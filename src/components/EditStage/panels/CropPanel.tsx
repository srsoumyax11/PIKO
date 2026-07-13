import type { PhotoItem } from "../../../types/photo";
import { PRESETS } from "../../../lib/constants";
import { Slider } from "../../ui/Slider";
import { usePhotoStore } from "../../../store/usePhotoStore";

interface CropPanelProps {
  photo: PhotoItem;
  updatePhoto: (id: string, updates: Partial<PhotoItem>) => void;
}

export function CropPanel({ photo, updatePhoto }: CropPanelProps) {
  const printSession = usePhotoStore(state => state.printSession);
  const updatePhotoPrintSettings = usePhotoStore(state => state.updatePhotoPrintSettings);
  
  const currentSettings = printSession.photoSettings[photo.id];
  const printSizeName = currentSettings?.printSize?.name || "Passport";
  
  const INP: React.CSSProperties = {
    width: "100%", padding: "8px 12px",
    border: "1px solid var(--line)", borderRadius: "var(--radius-s)",
    fontFamily: "'Inter', sans-serif", backgroundColor: "var(--paper)",
    boxSizing: "border-box"
  };

  return (
    <div>
      <p className="panel-section-label">Print Size</p>
      <div className="preset-grid">
        {PRESETS.map(preset => (
          <div
            key={preset.name}
            className={`preset-chip ${printSizeName === preset.name ? "is-active" : ""}`}
            onClick={() => {
              updatePhotoPrintSettings(photo.id, {
                printSize: { name: preset.name, widthMm: preset.width, heightMm: preset.height }
              });
              updatePhoto(photo.id, {
                croppedDataUrl: undefined,
                adjustedDataUrl: undefined
              });
            }}
          >
            <span className="preset-name">{preset.name}</span>
            <span className="preset-dims">{preset.width ? `${preset.width}×${preset.height}mm` : "Free"}</span>
          </div>
        ))}
      </div>
      
      {printSizeName === "Custom" && (
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "12px",
          animation: "slideDown 0.2s ease-out forwards"
        }}>
          <style>{`
            @keyframes slideDown {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <div>
            <label className="panel-section-label" style={{ fontSize: "11px", marginBottom: "6px", display: "block" }}>Width (mm)</label>
            <input 
              type="number" min={10} max={200} step={1} 
              value={currentSettings?.printSize?.widthMm || 35} 
              onChange={e => {
                updatePhotoPrintSettings(photo.id, {
                  printSize: { name: "Custom", widthMm: Number(e.target.value), heightMm: currentSettings?.printSize?.heightMm || 45 }
                });
                updatePhoto(photo.id, { croppedDataUrl: undefined, adjustedDataUrl: undefined });
              }} 
              style={{ ...INP, padding: "8px", boxSizing: "border-box" }} 
            />
          </div>
          <div>
            <label className="panel-section-label" style={{ fontSize: "11px", marginBottom: "6px", display: "block" }}>Height (mm)</label>
            <input 
              type="number" min={10} max={200} step={1} 
              value={currentSettings?.printSize?.heightMm || 45} 
              onChange={e => {
                updatePhotoPrintSettings(photo.id, {
                  printSize: { name: "Custom", widthMm: currentSettings?.printSize?.widthMm || 35, heightMm: Number(e.target.value) }
                });
                updatePhoto(photo.id, { croppedDataUrl: undefined, adjustedDataUrl: undefined });
              }} 
              style={{ ...INP, padding: "8px", boxSizing: "border-box" }} 
            />
          </div>
        </div>
      )}

      <div style={{ marginTop: "24px" }}>
        <Slider
          label="Zoom"
          value={Number((photo.zoom || 1).toFixed(2))}
          min={1}
          max={3}
          step={0.01}
          unit="×"
          onChange={(val) => updatePhoto(photo.id, { zoom: val })}
        />
      </div>

      <div style={{ marginTop: "12px" }}>
        <Slider
          label="Straighten"
          value={photo.rotation || 0}
          min={-45}
          max={45}
          step={1}
          unit="°"
          onChange={(val) => updatePhoto(photo.id, { rotation: val, croppedDataUrl: undefined, adjustedDataUrl: undefined })}
        />
      </div>
    </div>
  );
}
