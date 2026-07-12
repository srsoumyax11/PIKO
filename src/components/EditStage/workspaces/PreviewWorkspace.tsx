import { useEffect, useRef, useState } from "react";
import type { PhotoItem, PhotoCaption } from "../../../types/photo";
import { getDisplayUrl } from "../../../lib/photoUtils";
import { CHECKER } from "../../../lib/constants";
import { usePhotoStore } from "../../../store/usePhotoStore";

interface PreviewWorkspaceProps {
  photo: PhotoItem;
  aspect: number;
}

export function PreviewWorkspace({ photo, aspect }: PreviewWorkspaceProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewHeightPx, setPreviewHeightPx] = useState(0);
  const borderMm = usePhotoStore(state => state.printSettings.borderMm);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setPreviewHeightPx(e.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const displaySrc = getDisplayUrl(photo);
  const bgColor = photo.bgColor || "#ffffff";
  const isTransparent = bgColor === "transparent";
  const checkerStyle = isTransparent ? CHECKER : {};
  const borderPx = (borderMm || 0) * 3; // Note: temporary naive mm to px conversion, replaced in layout canvas

  const renderCaptionOverlay = (cap: PhotoCaption) => {
    if (cap.position !== "overlay-bottom" && cap.position !== "overlay-top") return null;
    const hPx = previewHeightPx;
    const pxPerMm = hPx > 0 ? hPx / (photo.printSize.heightMm || 45) : 2.5;
    const fPx = Math.max(8, Math.round(cap.fontSize * 0.352778 * pxPerMm));
    
    return (
      <div style={{
        position: "absolute", left: 0, right: 0,
        [cap.position === "overlay-top" ? "top" : "bottom"]: 0,
        backgroundColor: cap.bgColor && cap.bgColor !== "transparent" ? cap.bgColor : "rgba(0,0,0,0.5)",
        padding: `${Math.round(fPx * 0.25)}px ${Math.round(fPx * 0.5)}px`,
        textAlign: cap.align, fontFamily: cap.fontFamily,
        fontSize: `${fPx}px`, fontWeight: cap.bold ? "bold" : "normal",
        color: cap.color, lineHeight: 1.35, boxSizing: "border-box",
      }}>
        {cap.text}
      </div>
    );
  };

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div 
        ref={previewRef} 
        style={{ 
          aspectRatio: String(aspect), 
          backgroundColor: !isTransparent ? bgColor : "transparent", 
          ...checkerStyle, 
          maxHeight: "100%", 
          maxWidth: "100%", 
          position: "relative", 
          display: "flex", 
          overflow: "hidden" 
        }}
      >
        <img 
          src={displaySrc} 
          alt="preview" 
          style={{ 
            width: "100%", 
            height: "100%", 
            objectFit: "contain", 
            padding: borderPx > 0 ? `${borderPx}px` : "0", 
            boxSizing: "border-box", 
            filter: `brightness(${photo.brightness || 100}%) contrast(${photo.contrast || 100}%)` 
          }} 
        />
        {photo.caption?.text && renderCaptionOverlay(photo.caption)}
      </div>
    </div>
  );
}
