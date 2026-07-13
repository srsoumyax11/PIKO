/**
 * PIKO Photo Renderer — Single Source of Truth
 *
 * This function draws a complete photo (background, image, border, caption)
 * onto any canvas context at any DPI.
 *
 * Used by BOTH the live preview and the print exporter. Since both call the
 * same function with the same mm-based dimensions, the preview is
 * pixel-identical to the export — just at a different DPI.
 *
 * Unit pipeline:
 *   mm  →  px  (multiply by dpi / 25.4)
 *   pt  →  mm  (multiply by 0.352778)
 *   pt  →  px  (multiply by 0.352778 × dpi / 25.4)
 */

import type { PhotoItem } from "../types/photo";

export const PRINT_DPI = 300;
export const PREVIEW_DPI = 144; // Retina-friendly preview resolution

/** Convert millimetres to pixels at a given DPI. */
export function mmToPx(mm: number, dpi: number): number {
  return mm * (dpi / 25.4);
}

/** Convert typographic points to pixels at a given DPI. */
export function ptToPx(pt: number, dpi: number): number {
  return pt * 0.352778 * (dpi / 25.4);
}

/** Load an image from a URL (cached by the browser). */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Draw a single photo cell onto a canvas context.
 *
 * @param ctx    Target 2D context
 * @param img    Pre-loaded HTMLImageElement
 * @param photo  Full PhotoItem (for bgColor, brightness, contrast, caption)
 * @param xPx    Left edge of cell in canvas pixels
 * @param yPx    Top edge of cell in canvas pixels
 * @param wPx    Cell width in canvas pixels
 * @param hPx    Cell height in canvas pixels
 * @param dpi    Canvas DPI (used to scale pt font sizes and mm border)
 * @param settings Print settings for borders and cut lines
 */
export function drawPhotoCell(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  photo: PhotoItem,
  xPx: number, yPx: number, wPx: number, hPx: number,
  dpi: number,
  settings: {
    borderMm: number;
    borderColor: string;
    showCutLines: boolean;
    cutLineColor: string;
  }
): void {
  ctx.save();
  const borderPx = Math.round(mmToPx(settings.borderMm || 0, dpi));

  // 1. Fill cell background (= border color when border > 0)
  if (settings.borderMm > 0) {
    if (settings.borderColor && settings.borderColor !== "transparent") {
      ctx.fillStyle = settings.borderColor;
      ctx.fillRect(xPx, yPx, wPx, hPx);
    }
  } else {
    if (photo.bgColor && photo.bgColor !== "transparent") {
      ctx.fillStyle = photo.bgColor;
      ctx.fillRect(xPx, yPx, wPx, hPx);
    }
  }

  // 2. Determine image draw area
  const imgX = xPx + borderPx;
  const imgY = yPx + borderPx;
  const imgW = wPx - borderPx * 2;
  const imgH = hPx - borderPx * 2;

  // 3. Fill photo background color inside the image area (if not transparent)
  if (photo.bgColor && photo.bgColor !== "transparent") {
    ctx.fillStyle = photo.bgColor;
    ctx.fillRect(imgX, imgY, imgW, imgH);
  }

  // 4. (Removed) Brightness + contrast are now pre-baked into adjustedDataUrl.
  
  // 5. Draw image with OBJECT-FIT: COVER math
  const scaleX = imgW / img.naturalWidth;
  const scaleY = imgH / img.naturalHeight;
  const scale  = Math.max(scaleX, scaleY);

  const scaledW = img.naturalWidth  * scale;
  const scaledH = img.naturalHeight * scale;
  const offsetX = imgX + (imgW - scaledW) / 2;
  const offsetY = imgY + (imgH - scaledH) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(imgX, imgY, imgW, imgH);
  ctx.clip();
  ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);
  ctx.restore();

  // 6. Cut lines
  if (settings.showCutLines) {
    ctx.strokeStyle = settings.cutLineColor;
    const dashPx = Math.round(mmToPx(2, dpi));
    ctx.setLineDash([dashPx, dashPx]);
    ctx.lineWidth = Math.max(1, Math.round(mmToPx(0.2, dpi)));
    ctx.strokeRect(xPx + 0.5, yPx + 0.5, wPx - 1, hPx - 1);
    ctx.setLineDash([]);
  }

  // 8. Caption
  if (photo.caption && photo.caption.text.trim()) {
    const cap = photo.caption;
    const fPx = ptToPx(cap.fontSize, dpi); // Removed Math.round() for accurate scaling!
    ctx.font = `${cap.bold ? "bold " : ""}${fPx}px ${cap.fontFamily}`;
    ctx.textBaseline = "middle";
    ctx.textAlign = cap.align;

    const barPadH = fPx * 0.5;
    const maxWidth = imgW - (barPadH * 2);
    const lineHeight = fPx * 1.4;

    // Word wrap algorithm
    const words = cap.text.split(" ");
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);

    // Calculate dynamic bar height
    const totalTextHeight = lines.length * lineHeight;
    const barH = totalTextHeight + (fPx * 0.8); // Add padding top and bottom

    let barY: number;
    if (cap.position === "overlay-bottom") {
      barY = imgY + imgH - barH;
    } else if (cap.position === "overlay-top") {
      barY = imgY;
    } else {
      barY = imgY + imgH - barH;
    }

    if (cap.bgColor && cap.bgColor !== "transparent") {
      ctx.fillStyle = cap.bgColor;
      ctx.fillRect(imgX, barY, imgW, barH);
    }

    ctx.fillStyle = cap.color;
    const textX = cap.align === "left"
      ? imgX + barPadH
      : cap.align === "right"
      ? imgX + imgW - barPadH
      : imgX + imgW / 2;

    // Draw each line
    // startY is calculated so that the block of text is vertically centered in the bar
    let currentY = barY + (barH - totalTextHeight) / 2 + (lineHeight / 2);

    for (const line of lines) {
      ctx.fillText(line, textX, currentY);
      currentY += lineHeight;
    }
  }

  ctx.restore();
}
