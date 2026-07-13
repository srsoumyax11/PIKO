export type CaptionPosition = "below" | "above" | "overlay-bottom" | "overlay-top";

export type PhotoCaption = {
  text: string;
  fontSize: number;           // in pt, e.g. 8
  fontFamily: string;         // e.g. "Arial", "Inter"
  color: string;              // CSS color string, e.g. "#000000"
  bgColor: string;            // background bar color, "transparent" or CSS color
  position: CaptionPosition;
  bold: boolean;
  align: "left" | "center" | "right";
};

export type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PrintSize = {
  name: string;
  widthMm: number;
  heightMm: number;
};

export type PhotoItem = {
  id: string;

  // ── LAYER 0: IMPORT (Immutable) ──────────────────────────────
  originalFile: File;
  originalDataUrl: string;        // Raw uploaded image. Never mutated.

  // ── LAYER 1: BACKGROUND STAGE ────────────────────────────────
  bgRemoved: boolean;             // Operation flag: use transparent version?
  bgColor: string;                // CSS fill color behind the transparent photo
  bgRemovedDataUrl?: string;      // CACHE: AI result. Kept forever once computed.
                                  // Re-applying bg removal is instant (cache hit).

  // ── LAYER 2: CROP STAGE ──────────────────────────────────────
  cropRect: CropRect | null;      // Pixel-crop coordinates from react-easy-crop
  cropPosition: { x: number; y: number }; // Pan position in the cropper UI
  rotation: number;               // Degrees (-45 to 45)
  zoom: number;                   // 1.0 to 3.0
  croppedDataUrl?: string;        // CACHE: Canvas output after crop + rotation.
                                  // Invalidated when bgRemoved, cropRect, or rotation changes.

  // ── LAYER 3: ADJUST STAGE ────────────────────────────────────
  brightness: number;             // 0–200% (100 = no change)
  contrast: number;               // 0–200% (100 = no change)
  sharpenAmount: number;          // 0–100%
  adjustedDataUrl?: string;       // CACHE: Canvas output after brightness/contrast/sharpen.
                                  // Invalidated when croppedDataUrl or any adjust value changes.

  // ── CAPTION STAGE ────────────────────────────────────────────
  caption?: PhotoCaption;         // Optional text overlay (name, date, etc.)

  // ── PRINT SETTINGS (per-photo) ───────────────────────────────
  printSize: PrintSize;
  isSelectedForPrint: boolean;    // Checkbox in Layout gallery
  printCopies: number;            // Number input: how many copies of this photo to print

  // ── STATUS ───────────────────────────────────────────────────
  status: "imported" | "bg-processed" | "cropped" | "adjusted" | "ready";

  // ── CLEANUP ──────────────────────────────────────────────────
  _blobUrlsToCleanup?: string[];
};
