import type { PhotoItem } from "../../../types/photo";
import { PRESETS } from "../../../lib/constants";
import { Slider } from "../../ui/Slider";

interface CropPanelProps {
  photo: PhotoItem;
  updatePhoto: (id: string, updates: Partial<PhotoItem>) => void;
}

export function CropPanel({ photo, updatePhoto }: CropPanelProps) {
  return (
    <div>
      <p className="panel-section-label">Print Size</p>
      <div className="preset-grid">
        {PRESETS.map(preset => (
          <div
            key={preset.name}
            className={`preset-chip ${photo.printSize?.name === preset.name ? "is-active" : ""}`}
            onClick={() => updatePhoto(photo.id, {
              printSize: { name: preset.name, widthMm: preset.width, heightMm: preset.height },
              croppedDataUrl: undefined,
              adjustedDataUrl: undefined
            })}
          >
            <span className="preset-name">{preset.name}</span>
            <span className="preset-dims">{preset.width ? `${preset.width}×${preset.height}mm` : "Free"}</span>
          </div>
        ))}
      </div>

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
