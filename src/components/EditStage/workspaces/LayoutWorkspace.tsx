import { useEffect, useRef, useState } from "react";
import type { PhotoItem } from "../../../types/photo";
import { computeLayout, PAGE_SIZES, type PrintSettings, type LayoutResult } from "../../../lib/layoutEngine";
import { drawPhotoCell } from "../../../lib/photoRenderer";
import { Slider } from "../../ui/Slider";

interface LayoutWorkspaceProps {
  photos: PhotoItem[];
  photo: PhotoItem; // fallback for size when empty
  printSettings: PrintSettings;
}

export function LayoutWorkspace({ photos, photo, printSettings }: LayoutWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [baseScale, setBaseScale] = useState(1);
  const [zoom, setZoom] = useState(1);
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
      
      const aspect = pageDim.w / pageDim.h;
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
      setBaseScale(finalW / pageDim.w); // pixels per mm for the screen
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [pageDim.w, pageDim.h]);

  if (printPhotos.length === 0 || !layout) {
    return (
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", color: "var(--steel)" }}>
        <div style={{ fontSize: "32px", opacity: 0.3 }}>⊞</div>
        <p style={{ fontSize: "14px", margin: 0 }}>Set copies to 1+ in the Layout panel to preview.</p>
      </div>
    );
  }

  const zoomedW = canvasLogicalSize.w * zoom;
  const zoomedH = canvasLogicalSize.h * zoom;
  const currentScale = baseScale * zoom;

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
      
      {/* Header controls */}
      <div style={{ 
        display: "flex", alignItems: "center", justifyContent: "space-between", 
        padding: "12px 20px", borderBottom: "1px solid var(--line)", flexShrink: 0,
        backgroundColor: "rgba(255,255,255,0.8)", backdropFilter: "blur(8px)"
      }}>
        <p style={{ margin: 0, fontSize: "11px", color: "var(--steel)", letterSpacing: "0.5px" }}>
          {layout.totalPages} {layout.totalPages === 1 ? "PAGE" : "PAGES"}&nbsp;·&nbsp;{autoCols} COLS AUTO&nbsp;·&nbsp;{pageDim.w}×{pageDim.h}mm
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "11px", color: "var(--steel)" }}>Zoom: {Math.round(zoom * 100)}%</span>
          <div style={{ width: "120px" }}>
            <Slider value={zoom} min={0.5} max={3} step={0.1} onChange={setZoom} />
          </div>
          <button onClick={() => setZoom(1)} style={{ background: "none", border: "1px solid var(--line)", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", cursor: "pointer", color: "var(--steel)" }}>
            Fit
          </button>
        </div>
      </div>
      
      {/* Scrollable Container */}
      <div ref={containerRef} style={{ flex: 1, width: "100%", overflow: "auto", padding: "20px", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", backgroundColor: "#f5f5f5" }}>
        {canvasLogicalSize.w > 0 && Array.from({ length: layout.totalPages }).map((_, i) => (
          <PageCanvas
            key={i}
            pageIndex={i}
            layout={layout}
            printPhotos={printPhotos}
            printSettings={printSettings}
            scale={currentScale}
            width={zoomedW}
            height={zoomedH}
          />
        ))}
      </div>
    </div>
  );
}

interface PageCanvasProps {
  pageIndex: number;
  layout: LayoutResult;
  printPhotos: PhotoItem[];
  printSettings: PrintSettings;
  scale: number;
  width: number;
  height: number;
}

function PageCanvas({ pageIndex, layout, printPhotos, printSettings, scale, width, height }: PageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const cells = layout.cells.filter(c => c.pageIndex === pageIndex);

    const loadPromises = cells.map(cell => {
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
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      results.forEach(res => {
        if (!res) return;
        const { cell, img, cp } = res;
        
        const xPx = cell.xMm * scale;
        const yPx = cell.yMm * scale;
        const wPx = cell.widthMm * scale;
        const hPx = cell.heightMm * scale;
        const screenDpi = scale * 25.4;

        drawPhotoCell(ctx, img, cp, xPx, yPx, wPx, hPx, screenDpi, printSettings);
      });
    }).catch(console.error);
  }, [layout, pageIndex, printPhotos, printSettings, scale, width, height]);

  return (
    <div style={{ position: "relative", width: `${width}px`, height: `${height}px`, flexShrink: 0 }}>
      <canvas 
        ref={canvasRef}
        style={{ 
          width: "100%", 
          height: "100%",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)",
          backgroundColor: "white",
          display: "block"
        }}
      />
      <div style={{ position: "absolute", bottom: "-20px", left: 0, right: 0, textAlign: "center", fontSize: "11px", color: "var(--steel)" }}>
        Page {pageIndex + 1}
      </div>
    </div>
  );
}
