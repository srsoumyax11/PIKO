import React, { useRef, useState } from "react";
import { usePhotoStore } from "../../store/usePhotoStore";
import type { PhotoItem } from "../../types/photo";
import { validateImageFile } from "../../lib/fileValidator";

export function ImportStage() {
  const addPhotos = usePhotoStore(state => state.addPhotos);
  const updatePhotoPrintSettings = usePhotoStore(state => state.updatePhotoPrintSettings);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newPhotos: PhotoItem[] = [];
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      const validation = await validateImageFile(file);
      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.error}`);
        continue;
      }

      const originalDataUrl = URL.createObjectURL(file);
      
      const newPhoto: PhotoItem = {
        id: crypto.randomUUID(),
        originalFile: file,
        originalDataUrl,
        _blobUrlsToCleanup: [originalDataUrl],
        // Layer 1: Background
        bgRemoved: false,
        bgColor: "#ffffff",
        bgRemovedDataUrl: undefined,
        // Layer 2: Crop
        cropRect: null,
        cropPosition: { x: 0, y: 0 },
        zoom: 1,
        rotation: 0,
        croppedDataUrl: undefined,
        // Layer 3: Adjust
        brightness: 100,
        contrast: 100,
        sharpenAmount: 0,
        adjustedDataUrl: undefined,
        // Caption
        caption: undefined,
        // Status
        status: "imported",
      };
      
      newPhotos.push(newPhoto);
    }

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }
    if (newPhotos.length > 0) {
      addPhotos(newPhotos);
      newPhotos.forEach(photo => {
        updatePhotoPrintSettings(photo.id, {
          photoId: photo.id,
          printSize: { name: "Passport", widthMm: 35, heightMm: 45 },
          printCopies: 6,
          isSelectedForPrint: true
        });
      });
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div style={{ width: "100%" }}>
      <div 
        onClick={() => fileInputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{ 
          position: "relative",
          minHeight: "260px", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          backgroundColor: isDragOver ? "var(--focus-dim)" : "var(--paper)",
          border: `2px dashed ${isDragOver ? "var(--focus)" : "var(--line)"}`,
          borderRadius: "16px",
          width: "100%",
          cursor: "pointer",
          transition: "all 0.2s ease"
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{margin: "0 auto 16px auto", display: "block", color: "var(--focus)"}}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <p style={{ fontSize: "16px", margin: 0 }}>
          <span style={{ color: "var(--focus)", fontWeight: "600" }}>Click to upload</span> or drag and drop
        </p>
        <p style={{ fontSize: "13px", color: "var(--steel)", margin: "8px 0 0 0" }}>JPEG, PNG, HEIC up to 10MB</p>
      </div>
      <input
        type="file"
        multiple
        accept="image/jpeg, image/png, image/webp, image/heic"
        ref={fileInputRef}
        onChange={(e) => handleFiles(e.target.files)}
        style={{ display: "none" }}
      />
    </div>
  );
}
