import { useEffect, useRef, useState } from "react";
import type { PhotoItem } from "../../../types/photo";
import { getDisplayUrl } from "../../../lib/photoUtils";
import { CHECKER } from "../../../lib/constants";
import { usePhotoStore } from "../../../store/usePhotoStore";
import { drawPhotoCell } from "../../../lib/photoRenderer";

interface PreviewWorkspaceProps {
  photo: PhotoItem;
  aspect: number;
}

export function PreviewWorkspace({ photo, aspect }: PreviewWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const printSettings = usePhotoStore(state => state.printSettings);
  
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      let targetW = width;
      let targetH = targetW / aspect;
      if (targetH > height) {
        targetH = height;
        targetW = targetH * aspect;
      }
      setSize({ w: Math.floor(targetW), h: Math.floor(targetH) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspect]);

  useEffect(() => {
    if (size.w === 0 || size.h === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas entirely
    ctx.clearRect(0, 0, size.w, size.h);

    const imgSrc = getDisplayUrl(photo);
    const img = new Image();
    img.onload = () => {
      // Calculate fake DPI for the preview based on print size
      const screenDpi = (size.h / (photo.printSize.heightMm || 45)) * 25.4;

      drawPhotoCell(ctx, img, photo, 0, 0, size.w, size.h, screenDpi, printSettings);
    };
    img.src = imgSrc;
  }, [photo, size, printSettings]);

  const bgColor = photo.bgColor || "#ffffff";
  const isTransparent = bgColor === "transparent";

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: size.w, 
          height: size.h, 
          backgroundColor: !isTransparent ? bgColor : "transparent",
          ...(isTransparent && photo.bgRemoved ? CHECKER : {}),
          boxShadow: "0 4px 12px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)",
          display: "block"
        }} 
      />
    </div>
  );
}
