import { jsPDF } from "jspdf";
import type { PhotoItem } from "../types/photo";
import { getDisplayUrl } from "./photoUtils";
import { computeLayout, PAGE_SIZES, type PrintSettings } from "./layoutEngine";
import { drawPhotoCell, PRINT_DPI } from "./photoRenderer";

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
// Returns one data URL (JPEG) per page.
// ─────────────────────────────────────────────────────────────────
export async function generatePrintSheets(
  photos: PhotoItem[],
  settings: PrintSettings
): Promise<string[]> {
  // Any photo with copies > 0 is included — no separate checkbox needed
  const selected = photos.filter(p => p.printCopies > 0);
  if (selected.length === 0) return [];

  // Load all images in parallel
  const imageMap = new Map<string, HTMLImageElement>();
  await Promise.all(selected.map(async (photo) => {
    const url = getDisplayUrl(photo);
    const img = await loadImage(url);
    imageMap.set(photo.id, img);
  }));

  // Auto-calculate columns the same way the preview does
  const pageDim = PAGE_SIZES[settings.pageSize];
  const maxPhotoWidthMm = Math.max(...selected.map(p => p.printSize.widthMm || 35));
  const availableWidth = pageDim.w - settings.marginMm * 2;
  const autoCols = Math.max(1, Math.floor(
    (availableWidth + settings.gapMm) / (maxPhotoWidthMm + settings.gapMm)
  ));

  // Build the layout using the same auto-cols as the preview
  const layoutResult = computeLayout(
    { ...settings, cols: autoCols },
    selected.map(p => ({
      photoId: p.id,
      widthMm: p.printSize.widthMm || 35,
      heightMm: p.printSize.heightMm || 45,
      copies: p.printCopies,
    }))
  );

  const canvasW = Math.round(pageDim.w * MM_TO_PX);
  const canvasH = Math.round(pageDim.h * MM_TO_PX);

  // Render one canvas per page
  const pageDataUrls: string[] = [];

  for (let pageIdx = 0; pageIdx < layoutResult.totalPages; pageIdx++) {
    const canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Cannot get 2d context");

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
      drawPhotoCell(ctx, img, photo, xPx, yPx, wPx, hPx, PRINT_DPI, settings);
    }

    pageDataUrls.push(canvas.toDataURL("image/jpeg", 0.95));
  }

  return pageDataUrls;
}

// ─────────────────────────────────────────────────────────────────
// Legacy single-photo convenience wrappers (kept for compatibility)
// ─────────────────────────────────────────────────────────────────

import { DEFAULT_PRINT_SETTINGS } from "./layoutEngine";

export async function downloadPDF(photos: PhotoItem[], settings: PrintSettings = DEFAULT_PRINT_SETTINGS) {
  const dataUrls = await generatePrintSheets(photos, settings);
  if (dataUrls.length === 0) return;

  const pageDim = PAGE_SIZES[settings.pageSize];
  const pdf = new jsPDF({
    orientation: pageDim.w > pageDim.h ? "landscape" : "portrait",
    unit: "mm",
    format: [pageDim.w, pageDim.h],
  });

  dataUrls.forEach((url, i) => {
    if (i > 0) pdf.addPage([pageDim.w, pageDim.h]);
    pdf.addImage(url, "JPEG", 0, 0, pageDim.w, pageDim.h);
  });

  pdf.save("piko-photos.pdf");
}

export async function downloadImage(photos: PhotoItem[], settings: PrintSettings = DEFAULT_PRINT_SETTINGS) {
  const dataUrls = await generatePrintSheets(photos, settings);
  if (dataUrls.length === 0) return;

  dataUrls.forEach((url, i) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `piko-photos-page${i + 1}.jpg`;
    link.click();
  });
}
