import type { PhotoItem } from "../../../types/photo";
import { Slider } from "../../ui/Slider";

interface AdjustPanelProps {
  photo: PhotoItem;
  updatePhoto: (id: string, updates: Partial<PhotoItem>) => void;
}

export function AdjustPanel({ photo, updatePhoto }: AdjustPanelProps) {
  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <Slider 
          label="Brightness" 
          value={photo.brightness || 100} 
          min={0} max={200} step={1} unit="%"
          onChange={(val) => updatePhoto(photo.id, { brightness: val, adjustedDataUrl: undefined })} 
        />
      </div>
      
      <div style={{ marginBottom: "24px" }}>
        <Slider 
          label="Contrast" 
          value={photo.contrast || 100} 
          min={0} max={200} step={1} unit="%"
          onChange={(val) => updatePhoto(photo.id, { contrast: val, adjustedDataUrl: undefined })} 
        />
      </div>
      
      <div style={{ marginBottom: "24px" }}>
        <Slider 
          label="Sharpen" 
          value={photo.sharpenAmount || 0} 
          min={0} max={100} step={1} unit="%"
          onChange={(val) => updatePhoto(photo.id, { sharpenAmount: val, adjustedDataUrl: undefined })} 
        />
      </div>
    </div>
  );
}
