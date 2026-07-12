import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { PhotoItem } from "../types/photo";
import { DEFAULT_PRINT_SETTINGS, type PrintSettings } from "../lib/layoutEngine";

interface PhotoContextType {
  photos: PhotoItem[];
  printSettings: PrintSettings;
  addPhotos: (newPhotos: PhotoItem[]) => void;
  updatePhoto: (id: string, updates: Partial<PhotoItem>) => void;
  removePhoto: (id: string) => void;
  updatePrintSettings: (updates: Partial<PrintSettings>) => void;
}

const PhotoContext = createContext<PhotoContextType | undefined>(undefined);

export function PhotoProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [printSettings, setPrintSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);

  const addPhotos = useCallback((newPhotos: PhotoItem[]) => {
    setPhotos((prev) => [...prev, ...newPhotos]);
  }, []);

  const updatePhoto = useCallback((id: string, updates: Partial<PhotoItem>) => {
    setPhotos((prev) =>
      prev.map((photo) => (photo.id === id ? { ...photo, ...updates } : photo))
    );
  }, []);

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== id));
  }, []);

  const updatePrintSettings = useCallback((updates: Partial<PrintSettings>) => {
    setPrintSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <PhotoContext.Provider value={{ photos, printSettings, addPhotos, updatePhoto, removePhoto, updatePrintSettings }}>
      {children}
    </PhotoContext.Provider>
  );
}

export function usePhotos() {
  const context = useContext(PhotoContext);
  if (!context) {
    throw new Error("usePhotos must be used within a PhotoProvider");
  }
  return context;
}
