import { usePhotoStore } from "../../store/usePhotoStore";
import { getDisplayUrl } from "../../lib/photoUtils";

export function FooterFilmstrip({
  activePhotoId,
  onSelect,
}: {
  activePhotoId: string | null;
  onSelect: (id: string) => void;
}) {
  const photos = usePhotoStore(state => state.photos);

  if (photos.length === 0) return null;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      overflowX: "auto",
      padding: "8px 24px",
      width: "100%",
      backgroundColor: "var(--paper-raised)",
      borderTop: "1px solid var(--line)",
    }}>
      {photos.map(photo => {
        const displaySrc = getDisplayUrl(photo);
        const isActive = photo.id === activePhotoId;
        const bgColor = photo.bgRemoved && photo.bgColor && photo.bgColor !== "transparent"
          ? photo.bgColor
          : "#f0f0f0";

        return (
          <div
            key={photo.id}
            onClick={() => onSelect(photo.id)}
            style={{
              flexShrink: 0,
              position: "relative",
              width: "48px",
              height: "48px",
              borderRadius: "8px",
              overflow: "hidden",
              cursor: "pointer",
              border: `2px solid ${isActive ? "var(--focus)" : "transparent"}`,
              backgroundColor: bgColor,
              transition: "all 0.2s ease",
              opacity: isActive ? 1 : 0.65,
              boxShadow: isActive ? "0 0 0 1px var(--focus)" : "none",
            }}
            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.opacity = "1"; }}
            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.opacity = "0.65"; }}
          >
            <img
              src={displaySrc}
              alt="Thumbnail"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            {/* Status dot */}
            {photo.status !== "imported" && (
              <div style={{
                position: "absolute",
                bottom: "3px",
                right: "3px",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: photo.status === "ready" ? "#22c55e"
                  : photo.status === "adjusted" ? "#3b82f6"
                  : photo.status === "cropped" ? "#a855f7"
                  : photo.status === "bg-processed" ? "#f59e0b"
                  : "#64748b",
                border: "1.5px solid white",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
