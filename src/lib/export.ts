import { jsPDF } from "jspdf";
import type { PhotoItem } from "../types/photo";
import { getDisplayUrl } from "./photoUtils";
import { computeLayout, PAGE_SIZES } from "./layoutEngine";
import type { PrintSession } from "../types/photo";
import { PRINT_DPI, drawPhotoCell } from "./photoRenderer";
import { getCanvasContext } from "./canvas";

const MM_TO_PX = PRINT_DPI / 25.4; // ~11.811 pixels per mm at 300 DPI

// ─────────────────────────────────────────────────────────────────
// Image loader helper
// ─────────────────────────────────────────────────────────────────
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ─────────────────────────────────────────────────────────────────
// Generate a multi-photo print sheet for all selected photos.
// Returns one Blob (JPEG) per page.
// ─────────────────────────────────────────────────────────────────
export async function generatePrintSheets(
  photos: PhotoItem[],
  session: PrintSession
): Promise<Blob[]> {
  // Any photo with copies > 0 is included — no separate checkbox needed
  const selected = photos.filter(p => (session.photoSettings[p.id]?.printCopies || 0) > 0);
  if (selected.length === 0) return [];

  // Load all images in parallel
  const imageMap = new Map<string, HTMLImageElement>();
  await Promise.all(selected.map(async (photo) => {
    const url = getDisplayUrl(photo);
    const img = await loadImage(url);
    imageMap.set(photo.id, img);
  }));

  // Auto-calculate columns the same way the preview does
  const pageDim = PAGE_SIZES[session.pageSize];
  const maxPhotoWidthMm = Math.max(...selected.map(p => session.photoSettings[p.id]?.printSize.widthMm || 35));
  const availableWidth = pageDim.w - session.marginMm * 2;
  const autoCols = Math.max(1, Math.floor(
    (availableWidth + session.gapMm) / (maxPhotoWidthMm + session.gapMm)
  ));

  // Build the layout using the same auto-cols as the preview
  const layoutResult = computeLayout(
    { ...session, cols: autoCols },
    selected.map(p => {
      const s = session.photoSettings[p.id];
      return {
        photoId: p.id,
        widthMm: s?.printSize.widthMm || 35,
        heightMm: s?.printSize.heightMm || 45,
        copies: s?.printCopies || 0,
      };
    })
  );

  const canvasW = Math.round(pageDim.w * MM_TO_PX);
  const canvasH = Math.round(pageDim.h * MM_TO_PX);

  // Render one canvas per page
  const pageBlobs: Blob[] = [];

  for (let pageIdx = 0; pageIdx < layoutResult.totalPages; pageIdx++) {
    const canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = getCanvasContext(canvas, "2d");

    // White page background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Draw all cells for this page
    const pageCells = layoutResult.cells.filter(c => c.pageIndex === pageIdx);

    for (const cell of pageCells) {
      const photo = selected.find(p => p.id === cell.photoId);
      if (!photo) continue;

      const img = imageMap.get(photo.id);
      if (!img) continue;

      const xPx = Math.round(cell.xMm * MM_TO_PX);
      const yPx = Math.round(cell.yMm * MM_TO_PX);
      const wPx = Math.round(cell.widthMm * MM_TO_PX);
      const hPx = Math.round(cell.heightMm * MM_TO_PX);
      drawPhotoCell(ctx, img, photo, xPx, yPx, wPx, hPx, PRINT_DPI, session);
    }

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.95));
    if (blob) {
      pageBlobs.push(blob);
    }
  }

  return pageBlobs;
}

export async function downloadPDF(photos: PhotoItem[], session: PrintSession) {
  const blobs = await generatePrintSheets(photos, session);
  if (blobs.length === 0) return;

  const pageDim = PAGE_SIZES[session.pageSize];
  const pdf = new jsPDF({
    orientation: pageDim.w > pageDim.h ? "landscape" : "portrait",
    unit: "mm",
    format: [pageDim.w, pageDim.h],
  });

  for (let i = 0; i < blobs.length; i++) {
    const blob = blobs[i];
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    if (i > 0) pdf.addPage([pageDim.w, pageDim.h]);
    pdf.addImage(uint8Array, "JPEG", 0, 0, pageDim.w, pageDim.h);
  }

  pdf.save("piko-photos.pdf");
}

export async function downloadImage(photos: PhotoItem[], session: PrintSession) {
  const blobs = await generatePrintSheets(photos, session);
  if (blobs.length === 0) return;

  blobs.forEach((blob, i) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `piko-photos-page${i + 1}.jpg`;
    link.click();
    
    // Revoke the object URL after a short delay to free memory
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}
