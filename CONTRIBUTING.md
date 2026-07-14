# Contributing to PIKO 🚀

First off, thank you for considering contributing to PIKO! We want to make it as easy as possible to get involved.

## How Can I Contribute?

### 1. Adding New Countries & Document Formats (Easiest & Most Helpful!)
PIKO uses a **Single Source of Truth** for all SEO routes, Landing Page data, and Editor Crop Panel dropdowns. 
If your country's passport, visa, or standard ID format is missing, you can easily add it!

**How to add a new format:**
1. Open `src/lib/seoData.ts`.
2. Locate the `SEO_COUNTRIES` array.
3. Add a new object for your country (or append to an existing one):
```typescript
  {
    name: "Japan",
    code: "jp", // ISO 3166-1 alpha-2 standard
    popular: false,
    documents: [
      { 
        id: "jp-passport", 
        name: "Passport", 
        widthMm: 35, 
        heightMm: 45, 
        aspectRatio: 0.777, 
        notes: "White background, head size 32-36mm" 
      }
    ]
  }
```
4. Save the file. That's it! 
Because PIKO is fully dynamic, adding it here automatically:
- Creates a new feature card on the Landing Page.
- Generates a new SEO route (e.g., `/jp-passport-photo-maker`).
- Adds it to the XML Sitemap.
- Adds it to the Country & Format dropdowns in the Editor's Crop Tab.

### 2. Fixing Bugs & Adding Features
If you want to contribute to the core app (React/TypeScript):
1. Fork the repo and clone it locally.
2. Run `bun install` to install dependencies.
3. Run `bun run dev` to start the development server.
4. The core editor logic lives inside `src/components/EditStage/`.
5. State is managed globally via `zustand` in `src/store/usePhotoStore.ts`.

### 3. Improving the Layout Engine
The Layout Engine (`src/lib/layoutEngine.ts`) calculates how to best pack cropped photos onto physical paper sizes (A4, 4x6, etc.) based on DPI. If you are good at 2D bin-packing algorithms or canvas rendering, we always welcome optimizations to reduce wasted paper!

## Submitting a Pull Request
1. Create a new branch: `git checkout -b feature-name`
2. Make your changes and test them locally.
3. Ensure the TypeScript compiler is happy: `bun run build`
4. Push to your fork and submit a Pull Request.

## Code Style & Architecture
- **Vanilla CSS:** We use standard CSS (no Tailwind/Bootstrap) to keep the app lightweight and fast. Please write standard CSS in `layout.css` or component-specific CSS modules.
- **Client-Side Only:** PIKO is a privacy-first app. All processing (including AI background removal) MUST happen strictly on the client-side. Do not introduce server-side logic or external API dependencies for photo processing.
