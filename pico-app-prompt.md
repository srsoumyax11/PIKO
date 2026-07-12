# Project prompt: Pico

Build a web app called Pico. It automates the manual work a photo studio does when printing passport size photos: crop, enhance, sharpen, remove background, arrange multiple copies on a page, then print or save as PDF.

Everything runs in the browser. No backend server, no image upload to any server. All processing (editing, background removal, layout, export) happens on the client machine.

## Tech stack

- Runtime and package manager: Bun
- Framework: React (Vite template, `bun create vite pico --template react`)
- Language: TypeScript
- State: React state plus Context, no need for Redux at this scale
- Styling: Tailwind CSS

Set up the project with Bun first. Confirm the dev server runs before building features.

## Core idea: pipeline architecture

Each uploaded photo moves through a pipeline of stages. Each stage reads the image data from the previous stage, does its job, and passes an updated object to the next stage. Every photo carries its own data object through the whole pipeline, independently of other photos.

Stages, in order:

1. Import -> Drag Drop, Select from local machine
2. Edit (crop, rotate, pan, zoom, move, brightness, contrast, sharpen)
3. different premade layout for cropping like passport, stamp, pan, custom etc
4. Background removal (optional, user can skip)
5. Layout placement (page, size, copies)
6. Export (PDF or browser print)

## Data model

Define one TypeScript type that represents a single photo and travels through every stage. Something like this shape:

```ts
type PhotoItem = {
  id: string                    // unique id, generate with crypto.randomUUID()
  originalFile: File            // the raw uploaded file, never mutated
  originalDataUrl: string       // base64 or object URL of the original

  // edit stage output
  cropRect: { x: number; y: number; width: number; height: number } | null
  rotation: number               // degrees
  brightness: number             // -100 to 100
  contrast: number
  sharpenAmount: number
  editedDataUrl: string | null   // canvas output after edit stage

  // background removal stage output
  bgRemoved: boolean
  bgColor: string | null         // fill color used after removal, e.g. white or light blue
  bgRemovedDataUrl: string | null

  // per photo print settings, this is what makes multi photo multi size work
  printSize: { name: string; widthMm: number; heightMm: number } // e.g. Passport 35x45mm
  copies: number                 // how many times this photo repeats on the sheet

  status: "imported" | "edited" | "bg-removed" | "ready"
}
```

Keep an array of `PhotoItem` in a top level context, `PhotoProvider`, so any component can read or update any photo by id. Every stage component receives a photo id, reads that one item from context, updates it, writes it back to context, and moves to the next stage. Never mutate `originalFile` or `originalDataUrl`, always derive new data urls into the later fields, so the user can always go back and redo a stage from the original.

## Stage 1: Import

- Support drag and drop onto a drop zone, and a normal file picker
- Support multiple files selected at once
- Accept jpg, png, webp, heic if possible
- On import, create one `PhotoItem` per file, status `imported`
- Show a thumbnail grid of all imported photos
- Each thumbnail is clickable, clicking opens that photo in the edit stage

## Stage 2: Edit

- Use `react-easy-crop` or `Cropper.js` for the crop and rotate UI
- Provide sliders for brightness, contrast, sharpen amount
- Brightness and contrast: apply with canvas `ctx.filter = "brightness(x%) contrast(y%)"` when drawing the cropped region to an output canvas
- Sharpen: implement a 3x3 unsharp mask convolution kernel that runs on the canvas `ImageData`, apply it after brightness and contrast
- On save, render the final result to a canvas, export as data URL, store in `editedDataUrl`, set status to `edited`
- User can edit each photo independently, each photo have their own size also, switching between photos in the thumbnail grid
- Provide a "reset to original" button per photo, which just clears the edit fields and redraws from `originalDataUrl`

## Stage 3: Background removal

- Use the npm package `@imgly/background-removal`, it runs fully in browser using ONNX Runtime Web, no server call
- On first use, it downloads its model file, show a progress bar using the library's `progress` callback, and a note like "downloading model, saved for next time"
- Cache the model using the library's built in caching, so repeat use is instant
- After removal, composite the cutout onto a solid color background chosen by the user, since passport photos need a plain background, not transparent, offer a small color picker with common presets: white, light blue, light gray etc
- Store result in `bgRemovedDataUrl`, set status `bg-removed`
- Make this stage optional, add a "skip background removal" button that just copies `editedDataUrl` forward unchanged

## Stage 4: Layout placement

This stage takes all photos and arranges them onto printable pages.

- Page size dropdown: A4, 4x6 inch, Letter, custom mm input
- Per photo print size: each `PhotoItem` has its own `printSize`, user sets this per photo from a dropdown, presets include Passport 35x45mm, Visa 51x51mm, ID 25x35mm, Custom in Edit stage cropping
- Per photo copies: numeric input per photo, how many times it repeats can be zero so user can skip some image if want
- Global controls: gap between photos in mm, border width and color, page margin in mm

Layout algorithm, implement this as a pure function separate from any UI code so it is easy to test:

1. Convert all mm values to pixels at 300 DPI: `px = mm * dpi / 25.4`
2. Build a flat list of print jobs: for every `PhotoItem`, push it into the list `copies` times
3. Because photos can have different sizes, do not assume a uniform grid. Use a simple shelf packing algorithm: keep a running x cursor and y cursor per page. Place the next item at the current x cursor if it fits before the page's right margin, otherwise move to a new row, y cursor increases by the tallest item height in the row plus gap. If it does not fit vertically either, start a new page
4. Track the tallest item in the current row so the next row starts at the correct y offset, this is what makes mixed sizes wrap correctly instead of leaving gaps
5. Output an array of pages, each page is an array of placed items with `{ photoId, x, y, width, height }` in pixel coordinates

Render each page as a live preview using an HTML canvas or absolutely positioned divs at the mm to px scale, so the user sees exactly what will print before exporting.

## Stage 5: Export

- Build export using `jsPDF`: for each page from the layout stage, create a canvas at 300 DPI, draw every placed photo at its computed x, y, width, height, add borders if set, then add that canvas as an image into the PDF, one PDF page per layout page
- Also provide a simple "print" button that renders the same pages as an HTML view with `@media print` CSS matching the exact page size in mm, then calls `window.print()`, as a fallback that does not need `jsPDF`
- Both export paths should reuse the same layout data, do not duplicate the packing logic

## Multiple photo and multiple size support, explicit requirement

This is important and should be tested explicitly. The app must support all of the following at the same time:

- User uploads 5 photos
- Photo 1 is set to Passport size, 4 copies
- Photo 2 is set to Visa size, 2 copies
- Photo 3 skips background removal, others do not
- Photo 4 has a custom crop and a red border
- Photo 5 is a different image format than the rest

The layout stage must place all of these correctly on the minimum number of pages, respecting each photo's own size and copy count, without one photo's settings affecting another.

## Suggested folder structure

```
src/
  types/photo.ts          // PhotoItem type
  context/PhotoContext.tsx
  lib/
    canvas.ts              // crop, rotate, brightness, contrast draw helpers
    sharpen.ts             // unsharp mask kernel
    bgRemoval.ts            // wraps @imgly/background-removal
    layout.ts               // pure packing algorithm, page building
    pdfExport.ts             // jsPDF page building
  components/
    ImportStage/
    EditStage/
    BackgroundStage/
    LayoutStage/
    ExportStage/
    PhotoThumbnailGrid/
  App.tsx
```

## Build order

Build and test each stage before moving to the next, in this order:

1. Bun plus Vite plus React project, confirm it runs
2. `PhotoItem` type and `PhotoContext`
3. Import stage, multi file upload, thumbnail grid
4. Edit stage, crop, rotate, brightness, contrast, sharpen, tested on one photo at a time
5. Background removal stage, with progress bar and caching
6. Layout stage, pure packing function first, unit test it with mixed sizes, then build the preview UI
7. Export stage, PDF first, then browser print fallback

Do not skip ahead to layout or export until edit and background removal work correctly on a single photo and on multiple photos with different settings.
