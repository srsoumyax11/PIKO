import { create } from "zustand";
import type { PhotoItem } from "../types/photo";
import { DEFAULT_PRINT_SETTINGS, type PrintSettings } from "../lib/layoutEngine";

interface PhotoStore {
  photos: PhotoItem[];
  printSettings: PrintSettings;
  addPhotos: (newPhotos: PhotoItem[]) => void;
  updatePhoto: (id: string, updates: Partial<PhotoItem>) => void;
  removePhoto: (id: string) => void;
  updatePrintSettings: (updates: Partial<PrintSettings>) => void;
}

export const usePhotoStore = create<PhotoStore>((set) => ({
  photos: [],
  printSettings: DEFAULT_PRINT_SETTINGS,
  
  addPhotos: (newPhotos) => set((state) => ({ 
    photos: [...state.photos, ...newPhotos] 
  })),
  
  updatePhoto: (id, updates) => set((state) => ({
    photos: state.photos.map((photo) => 
      photo.id === id ? { ...photo, ...updates } : photo
    )
  })),
  
  removePhoto: (id) => set((state) => ({
    photos: state.photos.filter((photo) => photo.id !== id)
  })),
  
  updatePrintSettings: (updates) => set((state) => ({
    printSettings: { ...state.printSettings, ...updates }
  }))
}));
