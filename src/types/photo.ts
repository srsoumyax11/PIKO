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

export type PhotoCore = {
  id: string;

  // ── LAYER 0: IMPORT (Immutable) ──────────────────────────────
  originalFile: File;
  originalDataUrl: string;        // Raw uploaded image. Never mutated.

  // ── STATUS ───────────────────────────────────────────────────
  status: "imported" | "bg-processed" | "cropped" | "adjusted" | "ready";

  // ── CLEANUP ──────────────────────────────────────────────────
  _blobUrlsToCleanup?: string[];
};

export type PhotoLayers = {
  // ── LAYER 1: BACKGROUND STAGE ────────────────────────────────
  bgRemoved: boolean;             // Operation flag: use transparent version?
  bgColor: string;                // CSS fill color behind the transparent photo
  bgRemovedDataUrl?: string;      // CACHE: AI result. Kept forever once computed.

  // ── LAYER 2: CROP STAGE ──────────────────────────────────────
  cropRect: CropRect | null;      // Pixel-crop coordinates from react-easy-crop
  cropPosition: { x: number; y: number }; // Pan position in the cropper UI
  rotation: number;               // Degrees (-45 to 45)
  zoom: number;                   // 1.0 to 3.0
  croppedDataUrl?: string;        // CACHE: Canvas output after crop + rotation.

  // ── LAYER 3: ADJUST STAGE ────────────────────────────────────
  brightness: number;             // 0–200% (100 = no change)
  contrast: number;               // 0–200% (100 = no change)
  sharpenAmount: number;          // 0–100%
  adjustedDataUrl?: string;       // CACHE: Canvas output after brightness/contrast/sharpen.

  // ── CAPTION STAGE ────────────────────────────────────────────
  caption?: PhotoCaption;         // Optional text overlay (name, date, etc.)
};

export type PhotoPrintSettings = {
  photoId: string;
  printSize: PrintSize;
  printCopies: number;
  isSelectedForPrint: boolean;
};

// For backward compatibility on the editor side
export type PhotoItem = PhotoCore & PhotoLayers;

import type { PageSizeKey } from "../lib/layoutEngine";

export type PrintSession = {
  id: string;
  pageSize: PageSizeKey;
  marginMm: number;
  gapMm: number;
  cols?: number;
  borderMm: number;
  borderColor: string;
  showCutLines: boolean;
  cutLineColor: string;
  
  photoSettings: Record<string, PhotoPrintSettings>;
};
