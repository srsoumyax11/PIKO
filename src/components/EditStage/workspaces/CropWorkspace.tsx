import Cropper from "react-easy-crop";
import type { PhotoItem } from "../../../types/photo";
import { getSourceForCrop } from "../../../lib/photoUtils";
import { CHECKER } from "../../../lib/constants";

interface CropWorkspaceProps {
  photo: PhotoItem;
  aspect: number;
  updatePhoto: (id: string, updates: Partial<PhotoItem>) => void;
}

export function CropWorkspace({ photo, aspect, updatePhoto }: CropWorkspaceProps) {
  return (
    <Cropper
      image={getSourceForCrop(photo)}
      crop={photo.cropPosition || { x: 0, y: 0 }}
      zoom={photo.zoom || 1}
      rotation={photo.rotation || 0}
      aspect={aspect}
      onCropChange={pos => updatePhoto(photo.id, { cropPosition: pos })}
      onZoomChange={z => updatePhoto(photo.id, { zoom: z })}
      onRotationChange={r => updatePhoto(photo.id, { rotation: r })}
      onCropComplete={(_a, px) => updatePhoto(photo.id, { cropRect: px, croppedDataUrl: undefined, adjustedDataUrl: undefined })}
      style={{
        containerStyle: {
          backgroundColor: photo.bgRemoved && photo.bgColor && photo.bgColor !== "transparent" ? photo.bgColor : "#333333",
          ...(photo.bgRemoved && (!photo.bgColor || photo.bgColor === "transparent") ? CHECKER : {}),
        }
      }}
    />
  );
}
