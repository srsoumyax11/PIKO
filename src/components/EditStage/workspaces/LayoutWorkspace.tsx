import { useEffect, useRef, useState } from "react";
import type { PhotoItem } from "../../../types/photo";
import { computeLayout, PAGE_SIZES, type PrintSettings } from "../../../lib/layoutEngine";
import { drawPhotoCell } from "../../../lib/photoRenderer";

interface LayoutWorkspaceProps {
  photos: PhotoItem[];
  photo: PhotoItem; // fallback for size when empty
  printSettings: PrintSettings;
}

export function LayoutWorkspace({ photos, photo, printSettings }: LayoutWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [canvasLogicalSize, setCanvasLogicalSize] = useState({ w: 0, h: 0 });

  const printPhotos = photos.filter(p => p.printCopies > 0);
  const pageDim = PAGE_SIZES[printSettings.pageSize];

  const maxW = printPhotos.length > 0 ? Math.max(...printPhotos.map(p => p.printSize.widthMm || 35)) : (photo.printSize.widthMm || 35);
  const avail = pageDim.w - printSettings.marginMm * 2;
  const autoCols = Math.max(1, Math.floor((avail + printSettings.gapMm) / (maxW + printSettings.gapMm)));
  
  const layout = printPhotos.length > 0
    ? computeLayout(
        { ...printSettings, cols: autoCols },
        printPhotos.map(p => ({
          photoId: p.id,
          widthMm: p.printSize.widthMm || 35,
          heightMm: p.printSize.heightMm || 45,
          copies: p.printCopies
        }))
      )
    : null;

  // 1. Calculate how to scale the A4/page canvas down to fit the screen
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      const containerW = entry.contentRect.width;
      const containerH = entry.contentRect.height;
      
      // We want to render the canvas at a high enough resolution to look sharp,
      // but scale it via CSS to fit perfectly in the container.
      
      // Page aspect ratio
      const aspect = pageDim.w / pageDim.h;
      
      // Fit to container (with some padding)
      const pad = 40;
      const availW = containerW - pad;
      const availH = containerH - pad;
      
      let finalW = availW;
      let finalH = finalW / aspect;
      
      if (finalH > availH) {
        finalH = availH;
        finalW = finalH * aspect;
      }
      
      setCanvasLogicalSize({ w: finalW, h: finalH });
      setScale(finalW / pageDim.w); // pixels per mm for the screen
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [pageDim.w, pageDim.h]);

  // 2. Draw the layout to the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layout || canvasLogicalSize.w === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use a device pixel ratio scaling for crispness on retina screens
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasLogicalSize.w * dpr;
    canvas.height = canvasLogicalSize.h * dpr;
    ctx.scale(dpr, dpr);

    const firstPageCells = layout.cells.filter(c => c.pageIndex === 0);

    // Pre-load all images so we can draw synchronously and avoid flickering
    const loadPromises = firstPageCells.map(cell => {
      return new Promise<{ cell: typeof cell, img: HTMLImageElement, cp: PhotoItem } | null>((resolve) => {
        const cp = printPhotos.find(p => p.id === cell.photoId);
        if (!cp) return resolve(null);

        const imgSrc = cp.adjustedDataUrl || cp.croppedDataUrl || cp.bgRemovedDataUrl || cp.originalDataUrl;
        const img = new Image();
        img.onload = () => resolve({ cell, img, cp });
        img.onerror = () => resolve(null);
        img.src = imgSrc;
      });
    });

    Promise.all(loadPromises).then(results => {
      // Clear background (white paper) only after images are ready
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasLogicalSize.w, canvasLogicalSize.h);

      results.forEach(res => {
        if (!res) return;
        const { cell, img, cp } = res;
        
        // Convert mm to screen pixels using our calculated scale
        const xPx = cell.xMm * scale;
        const yPx = cell.yMm * scale;
        const wPx = cell.widthMm * scale;
        const hPx = cell.heightMm * scale;

        // For the border stroke width inside drawPhotoCell to scale correctly,
        // we need to pass a "fake DPI" that corresponds to our screen scale.
        // mmToPx = mm * (dpi / 25.4) -> scale = dpi / 25.4 -> dpi = scale * 25.4
        const screenDpi = scale * 25.4;

        drawPhotoCell(ctx, img, cp, xPx, yPx, wPx, hPx, screenDpi, printSettings);
      });
    }).catch(console.error);

  }, [layout, canvasLogicalSize, scale, printSettings, printPhotos]);

  if (printPhotos.length === 0) {
    return (
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", color: "var(--steel)" }}>
        <div style={{ fontSize: "32px", opacity: 0.3 }}>⊞</div>
        <p style={{ fontSize: "14px", margin: 0 }}>Set copies to 1+ in the Layout panel to preview.</p>
      </div>
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", padding: "20px", boxSizing: "border-box" }}>
      <p style={{ margin: 0, fontSize: "11px", color: "var(--steel)", letterSpacing: "0.5px", flexShrink: 0 }}>
        PAGE 1 OF {layout?.totalPages}&nbsp;·&nbsp;{autoCols} COLS AUTO&nbsp;·&nbsp;{pageDim.w}×{pageDim.h}mm
      </p>
      
      <div ref={containerRef} style={{ flex: 1, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
        {canvasLogicalSize.w > 0 && (
          <canvas 
            ref={canvasRef}
            style={{ 
              width: `${canvasLogicalSize.w}px`, 
              height: `${canvasLogicalSize.h}px`,
              boxShadow: "0 4px 32px rgba(0,0,0,0.15)",
              backgroundColor: "white",
              display: "block"
            }}
          />
        )}
      </div>
    </div>
  );
}
