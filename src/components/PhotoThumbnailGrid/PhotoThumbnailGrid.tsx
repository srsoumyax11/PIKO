import { usePhotos } from "../../context/PhotoContext";
import { getDisplayUrl } from "../../lib/photoUtils";

interface Props {
  onPhotoSelect?: (id: string) => void;
}

export function PhotoThumbnailGrid({ onPhotoSelect }: Props) {
  const { photos } = usePhotos();

  if (photos.length === 0) return null;

  return (
    <div className="thumbnail-grid">
      {photos.map((photo) => {
        const displaySrc = getDisplayUrl(photo);
        const bgColor = photo.bgRemoved && photo.bgColor && photo.bgColor !== "transparent"
          ? photo.bgColor
          : "#f0f0f0";
        return (
          <div
            key={photo.id}
            className="thumbnail-item"
            style={{ backgroundColor: bgColor }}
            onClick={() => onPhotoSelect?.(photo.id)}
          >
            <img src={displaySrc} alt="thumbnail" style={{
              width: "100%", height: "100%", objectFit: "cover",
            }} />
          </div>
        );
      })}
    </div>
  );
}
