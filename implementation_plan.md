# PIKO — Full System Architecture Plan

## 1. The Core Problem: What Is Broken Today

The current system has three fundamental issues:
1. **Ad-hoc data cascade** — There is no guaranteed order. The `displaySrc` logic is a guessing chain (`sharpenedDataUrl || editedDataUrl || ...`) that works by accident, not by design.
2. **Re-render blindness** — The Gallery thumbnail and Footer filmstrip re-read state to pick a display image, but they use the *wrong* field (`bgRemovedFullDataUrl` even when `bgRemoved = false`), so they can show stale images.
3. **Layout is single-photo only** — The entire Layout/export pipeline is wired to a single `activePhotoId`, blocking batch printing.

---

## 2. Non-Destructive Pipeline: Layered State Model

Think of this exactly like Photoshop's layer model. Each stage **reads from the layer below it** and writes its own output above it. Going backward always invalidates the layers above.

```
┌─────────────────────────────────────────────┐
│  Layer 0 (Immutable): originalDataUrl        │  ← NEVER changes. Source of truth.
├─────────────────────────────────────────────┤
│  Layer 1 (BG Stage): bgRemovedDataUrl        │  ← AI result. Cached forever once computed.
│  Operation flag: bgRemoved: boolean          │  ← Toggle: use Layer 1 or Layer 0?
├─────────────────────────────────────────────┤
│  Layer 2 (Crop Stage): croppedDataUrl        │  ← Canvas output. Re-run if Layer 1 or ops change.
│  Operations: cropRect, rotation, zoom        │
├─────────────────────────────────────────────┤
│  Layer 3 (Adjust Stage): adjustedDataUrl     │  ← Canvas output. Re-run if Layer 2 or ops change.
│  Operations: brightness, contrast, sharpen   │
├─────────────────────────────────────────────┤
│  DISPLAY IMAGE: adjustedDataUrl              │  ← The single final output consumed everywhere.
│  || croppedDataUrl || (bgRemoved?bgRemovedDataUrl:originalDataUrl)
└─────────────────────────────────────────────┘
```

### Key Rule: `displayUrl` is a computed property
Instead of every component having its own fallback chain, we expose a single helper function:

```typescript
// In types/photo.ts or a utils file
export function getDisplayUrl(photo: PhotoItem): string {
  return (
    photo.adjustedDataUrl ||
    photo.croppedDataUrl  ||
    (photo.bgRemoved ? photo.bgRemovedDataUrl : null) ||
    photo.originalDataUrl
  );
}
```

Every component — Gallery, Filmstrip, Preview, Layout — calls **only this one function**. When state updates in context, React re-renders them all automatically and they all show the correct latest image.

---

## 3. Updated `PhotoItem` Type

```typescript
export type PhotoItem = {
  id: string;

  // ── LAYER 0: IMPORT (Immutable) ──────────────────
  originalFile: File;
  originalDataUrl: string;

  // ── LAYER 1: BACKGROUND ──────────────────────────
  bgRemoved: boolean;              // Operation flag: is the transparent version active?
  bgColor: string;                 // e.g. "#ffffff" or "transparent"
  bgRemovedDataUrl?: string;       // CACHE: AI output. Stored permanently once computed.

  // ── LAYER 2: CROP ────────────────────────────────
  cropRect: CropRect | null;       // Operation
  cropPosition: { x: number; y: number }; // Cropper UI pan
  rotation: number;                // Operation
  zoom: number;                    // Operation
  croppedDataUrl?: string;         // CACHE: Canvas output of crop + rotation

  // ── LAYER 3: ADJUST ──────────────────────────────
  brightness: number;              // Operation (0-200%)
  contrast: number;                // Operation (0-200%)
  sharpenAmount: number;           // Operation (0-100%)
  adjustedDataUrl?: string;        // CACHE: Canvas output of brightness/contrast/sharpen

  // ── LAYOUT & PRINT ───────────────────────────────
  printSize: { name: string; widthMm: number; heightMm: number };
  isSelectedForPrint: boolean;     // NEW: Checkbox in the Layout gallery
  printCopies: number;             // NEW: Per-photo copy count (number input, not slider)
  pageSettings?: {                 // Global page settings (moved out of per-photo)
    pageSize: string;              // "A4", "4x6"
    marginMm: number;              // NEW: Page margin in mm
    gap: number;                   // Gap between photos in mm
    cols: number;                  // Photos per row
  };

  // ── STATUS ───────────────────────────────────────
  status: "imported" | "bg-processed" | "cropped" | "adjusted" | "ready";
};
```

> [!IMPORTANT]
> `pageSettings` (page size, margin, cols, gap) should ideally be **global app state**, not per-photo. Every photo selected for printing shares the same page. This means it should move into `AppShell` state or a separate `PrintContext`.

---

## 4. Cache Invalidation Rules

| If user changes...              | Invalidate (clear to `undefined`)              |
|---------------------------------|------------------------------------------------|
| `bgRemoved` toggle              | `croppedDataUrl`, `adjustedDataUrl`            |
| Run AI BG removal again         | `bgRemovedDataUrl` re-generated, then cascade |
| `cropRect`, `rotation`, `zoom`  | `croppedDataUrl`, `adjustedDataUrl`            |
| `brightness`, `contrast`, `sharpen` | `adjustedDataUrl` only                    |

When we call `updatePhoto` for a BG operation:
```typescript
// In EditStage, when bgRemoved toggles:
updatePhoto(photo.id, { 
  bgRemoved: true, 
  croppedDataUrl: undefined,   // ← cascade: invalidate downstream caches
  adjustedDataUrl: undefined 
});
```

The `useEffect` in `EditStage` that watches for crop changes will automatically fire and regenerate `croppedDataUrl`, which in turn triggers the sharpen `useEffect` to regenerate `adjustedDataUrl`.

---

## 5. BG Removal Caching (Instant Re-apply)

The key insight: **`bgRemovedDataUrl` is never cleared once set.** The `bgRemoved` flag is just a boolean switch that says "use it or don't."

```
State A: bgRemoved=false, bgRemovedDataUrl=undefined  → "Remove BG" button
State B: bgRemoved=true,  bgRemovedDataUrl="data:..."  → Shows "Restore BG" button
State C: bgRemoved=false, bgRemovedDataUrl="data:..."  → Shows "Remove BG" (re-apply instantly!)
```

When in State C, clicking "Remove BG" just sets `bgRemoved=true` — **no AI call, instant.** This is the cache hit.

---

## 6. State-Driven UI for Gallery & Filmstrip

Both `PhotoThumbnailGrid` and `FooterFilmstrip` subscribe to `usePhotos()`. Since React re-renders all consumers on state change, the fix is simple:

1. Create and export `getDisplayUrl(photo)` helper.
2. Replace all ad-hoc fallback chains in both components with `getDisplayUrl(photo)`.
3. The thumbnail background color should also read from `photo.bgColor` only when `photo.bgRemoved === true`, else default grey.

```typescript
// Both components use:
const displaySrc = getDisplayUrl(photo);
const bgColor = photo.bgRemoved && photo.bgColor ? photo.bgColor : "#f0f0f0";
```

---

## 7. Layout Stage: Multi-Photo Batch Printing

### The Problem
Currently only one photo can be selected and printed.

### The New Design
The Layout tab gets a two-panel redesign:

**Left Panel (Canvas):** Shows the live print preview page with all selected photos arranged in a grid.

**Right Panel (Controls):** 
- **Photo Gallery (Selectable):** A grid of ALL imported photos with a checkbox overlay on each thumbnail. Checking a photo adds it to the print batch.
- **Per-Photo Controls:** When a photo is checked/selected in the gallery, show its individual controls:
  - `Copies:` — A number input (not a slider), min 1, max 99.
- **Page Settings (Global):**
  - `Page Size`: Select dropdown (A4, 4x6, etc.)
  - `Photos per Row`: Select dropdown (2-8)
  - `Page Margin (mm)`: Number input
  - `Gap (mm)`: Number input (not a slider)
- **Summary:** "Total photos on sheet: X" (computed, read-only)

### Data Flow for Layout
```
selectedPhotos = photos.filter(p => p.isSelectedForPrint)

// For each photo in selectedPhotos, repeat it `printCopies` times
const printQueue = selectedPhotos.flatMap(p => Array(p.printCopies).fill(p))

// Render the print preview using printQueue
```

---

## 8. Files to Create / Modify

### [MODIFY] `src/types/photo.ts`
- Add `isSelectedForPrint`, `printCopies` fields.
- Rename `editedDataUrl` → `croppedDataUrl`, `sharpenedDataUrl` → `adjustedDataUrl`.
- Add `bgRemovedDataUrl` (rename from `bgRemovedFullDataUrl`).

### [NEW] `src/lib/photoUtils.ts`
- Export `getDisplayUrl(photo: PhotoItem): string` — the single source of truth for display image.
- Export `getSourceForCrop(photo: PhotoItem): string` — returns `bgRemovedDataUrl || originalDataUrl`.

### [MODIFY] `src/context/PhotoContext.tsx`
- Add a `PrintContext` or `globalPageSettings` state to `AppShell` for page-level settings (pageSize, margin, gap, cols).

### [MODIFY] `src/components/PhotoThumbnailGrid/PhotoThumbnailGrid.tsx`
- Use `getDisplayUrl(photo)` helper.

### [MODIFY] `src/components/FooterFilmstrip/FooterFilmstrip.tsx`
- Use `getDisplayUrl(photo)` helper.
- Add status badge indicator (small dot showing bg-removed, cropped, etc.).

### [MODIFY] `src/components/EditStage/EditStage.tsx`
- Refactor all internal `displaySrc` and `sourceForCrop` logic to use `getDisplayUrl` / `getSourceForCrop`.
- Implement cache invalidation on `bgRemoved` toggle.
- Rename state fields to match new type.

### [MODIFY] `src/components/EditStage/EditStage.tsx` — Layout Tab Section
- Replace single-photo layout with multi-photo batch layout.
- Add selectable photo gallery with checkboxes.
- Add per-photo `printCopies` number input.
- Add `marginMm` number input to page settings.
- Replace `copies` slider with a computed total display.

---

## Open Questions for You

> [!IMPORTANT]
> **Q1: Field Renaming** — Do you want me to rename `editedDataUrl` → `croppedDataUrl` and `sharpenedDataUrl` → `adjustedDataUrl`? This is cleaner but is a breaking change.

> [!IMPORTANT]
> **Q2: Page Settings** — Should page settings (page size, margin, gap, cols) live in a global `PrintContext`, or be stored on the "first selected photo" for simplicity?

> [!IMPORTANT]
> **Q3: Layout Panel** — Should the selectable photo gallery in the Layout tab be in the **right panel** (like a sidebar), or should it be a **bottom strip** below the canvas preview?

If this plan looks correct to you, click **Proceed** and I will implement everything in a clean, single pass.
