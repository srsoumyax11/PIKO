import type { PhotoItem } from "../../../types/photo";
import { CHECKER } from "../../../lib/constants";

interface BackgroundWorkspaceProps {
  photo: PhotoItem;
  isRemovingBg: boolean;
  bgProgress: string;
}

export function BackgroundWorkspace({ photo, isRemovingBg, bgProgress }: BackgroundWorkspaceProps) {
  const bgSrc = photo.bgRemoved && photo.bgRemovedDataUrl ? photo.bgRemovedDataUrl : photo.originalDataUrl;
  const bgColor = photo.bgColor || "#ffffff";
  const isTransparent = bgColor === "transparent";

  return (
    <div style={{
      width: "100%", height: "100%", position: "relative", display: "flex",
      justifyContent: "center", alignItems: "center",
      backgroundColor: !isTransparent ? bgColor : "transparent",
      ...(isTransparent && photo.bgRemoved ? CHECKER : {})
    }}>
      <img src={bgSrc} alt="preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
      {isRemovingBg && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.8)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", border: "3px solid var(--focus)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <p style={{ margin: 0, fontWeight: 600, fontSize: "13px", color: "var(--ink)" }}>{bgProgress}</p>
        </div>
      )}
      <style>{`@keyframes spin{100%{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
