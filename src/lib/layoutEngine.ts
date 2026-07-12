// ─────────────────────────────────────────────────────────────────
// PIKO Layout Engine
//
// This is the single source of truth for ALL layout math.
// Both the React preview and the canvas exporter call computeLayout().
// This guarantees the preview is pixel-perfect identical to the export.
// ─────────────────────────────────────────────────────────────────

export type PageSizeKey = "A4" | "4x6 in" | "6x4 in" | "5x7 in" | "Letter";

export const PAGE_SIZES: Record<PageSizeKey, { w: number; h: number; label: string }> = {
  "A4":      { w: 210,   h: 297,   label: "A4 (210×297mm)" },
  "4x6 in":  { w: 101.6, h: 152.4, label: "4×6 inch" },
  "6x4 in":  { w: 152.4, h: 101.6, label: "6x4 inch"},
  "5x7 in":  { w: 127,   h: 177.8, label: "5×7 inch" },
  "Letter":  { w: 215.9, h: 279.4, label: "Letter (US)" },
};

export type PrintSettings = {
  pageSize: PageSizeKey;
  marginMm: number;       // Page margin (all sides)
  gapMm: number;          // Gap between photos
  cols: number;           // Photos per row (auto-calculated)
  showCutLines: boolean;
  cutLineColor: string;
  borderMm: number;       // Photo border width in mm
  borderColor: string;    // Border fill color
};

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  pageSize: "A4",
  marginMm: 0,
  gapMm: 0,
  cols: 6,
  showCutLines: true,
  cutLineColor: "#cccccc",
  borderMm: 1,
  borderColor: "#ffffff",
};

export type PrintPhoto = {
  photoId: string;
  widthMm: number;
  heightMm: number;
  copies: number;
};

export type ComputedCell = {
  photoId: string;        // Which photo from the batch
  copyIndex: number;      // Which copy number (0-based)
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  pageIndex: number;
};

export type LayoutResult = {
  cells: ComputedCell[];
  totalPages: number;
  pageWidthMm: number;
  pageHeightMm: number;
};

/**
 * Core layout computation. Returns the position of every photo cell
 * in mm, across all pages. Used by both the preview and the exporter.
 */
export function computeLayout(
  settings: PrintSettings,
  photos: PrintPhoto[]
): LayoutResult {
  const pageDim = PAGE_SIZES[settings.pageSize];
  const { marginMm, gapMm, cols } = settings;

  const availableWidth = pageDim.w - marginMm * 2;

  const cells: ComputedCell[] = [];
  let pageIndex = 0;
  
  // Build the full queue: expand each photo by its copy count
  const queue: Array<{ photoId: string; widthMm: number; heightMm: number }> = [];
  for (const p of photos) {
    for (let c = 0; c < p.copies; c++) {
      queue.push({ photoId: p.photoId, widthMm: p.widthMm, heightMm: p.heightMm });
    }
  }

  // We process row by row to center each row horizontally if needed.
  let qIdx = 0;
  let curY = marginMm;

  while (qIdx < queue.length) {
    // Collect items for the next row
    const rowItems: Array<{ photoId: string; widthMm: number; heightMm: number; copyIndex: number }> = [];
    let rowWidth = 0;
    
    // Fill the row up to `cols` items
    while (rowItems.length < cols && qIdx < queue.length) {
      const item = queue[qIdx];
      // If we strictly follow the 'cols' setting (which is computed dynamically to fit the max width),
      // we assume they fit. The math in LayoutPanel calculates autoCols based on the max width.
      rowItems.push({ ...item, copyIndex: qIdx });
      rowWidth += item.widthMm;
      if (rowItems.length > 1) {
        rowWidth += gapMm;
      }
      qIdx++;
    }

    // Find tallest item in this row
    let maxRowHeight = 0;
    for (const item of rowItems) {
      if (item.heightMm > maxRowHeight) maxRowHeight = item.heightMm;
    }

    // Check if row overflows the page vertically
    if (curY + maxRowHeight > pageDim.h - marginMm) {
      pageIndex++;
      curY = marginMm;
    }

    // Center this row horizontally within the available width
    // Or if rowWidth > availableWidth, it might overflow, but we still center or start at margin.
    const startX = marginMm + Math.max(0, (availableWidth - rowWidth) / 2);

    let curX = startX;
    for (const item of rowItems) {
      cells.push({
        photoId: item.photoId,
        copyIndex: item.copyIndex,
        xMm: curX,
        yMm: curY,
        widthMm: item.widthMm,
        heightMm: item.heightMm,
        pageIndex,
      });
      curX += item.widthMm + gapMm;
    }

    curY += maxRowHeight + gapMm;
  }

  return {
    cells,
    totalPages: pageIndex + (queue.length > 0 ? 1 : 0),
    pageWidthMm: pageDim.w,
    pageHeightMm: pageDim.h,
  };
}
