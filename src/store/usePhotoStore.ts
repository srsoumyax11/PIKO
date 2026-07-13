import { create } from "zustand";
import type { PhotoItem, PrintSession, PhotoPrintSettings } from "../types/photo";
import { DEFAULT_PRINT_SETTINGS, type PrintSettings } from "../lib/layoutEngine";
import { validatePrintSettings } from "../lib/validation";
import { revokePhotoUrls } from "../lib/photoCleanup";

interface PhotoStore {
  photos: PhotoItem[];
  printSession: PrintSession;
  addPhotos: (newPhotos: PhotoItem[]) => void;
  updatePhoto: (id: string, updates: Partial<PhotoItem>) => void;
  removePhoto: (id: string) => void;
  updatePrintSettings: (updates: Partial<PrintSettings>) => void;
  updatePhotoPrintSettings: (photoId: string, settings: Partial<PhotoPrintSettings>) => void;
  
  batchUpdate: (batch: {
    photoUpdates?: Array<{ id: string; updates: Partial<PhotoItem> }>;
    settingsUpdates?: Partial<PrintSettings>;
  }) => void;
}

export const usePhotoStore = create<PhotoStore>((set) => ({
  photos: [],
  printSession: {
    ...DEFAULT_PRINT_SETTINGS,
    id: "default",
    photoSettings: {}
  },
  
  addPhotos: (newPhotos) => set((state) => ({ 
    photos: [...state.photos, ...newPhotos] 
  })),
  
  updatePhoto: (id, updates) => set((state) => ({
    photos: state.photos.map((photo) => 
      photo.id === id ? { ...photo, ...updates } : photo
    )
  })),
  
  removePhoto: (id) => set((state) => {
    const photo = state.photos.find(p => p.id === id);
    if (photo) {
      revokePhotoUrls(photo);
    }
    
    // Clean up orphaned print settings
    const newSettings = { ...state.printSession.photoSettings };
    delete newSettings[id];
    
    return {
      photos: state.photos.filter((photo) => photo.id !== id),
      printSession: { ...state.printSession, photoSettings: newSettings }
    };
  }),
  
  updatePrintSettings: (updates) => set((state) => {
    const validated = validatePrintSettings(updates);
    if (!validated) {
      console.warn("Invalid print settings update ignored");
      return state;
    }
    return { printSession: { ...state.printSession, ...validated } };
  }),
  
  updatePhotoPrintSettings: (photoId, settings) => set((state) => {
    const current = state.printSession.photoSettings[photoId] || {
      photoId,
      printSize: { name: "Passport", widthMm: 35, heightMm: 45 },
      printCopies: 0,
      isSelectedForPrint: false
    };
    
    return {
      printSession: {
        ...state.printSession,
        photoSettings: {
          ...state.printSession.photoSettings,
          [photoId]: { ...current, ...settings }
        }
      }
    };
  }),
  
  batchUpdate: (batch) => set((state) => {
    let newPhotos = state.photos;
    if (batch.photoUpdates) {
      newPhotos = state.photos.map((photo) => {
        const update = batch.photoUpdates!.find(p => p.id === photo.id);
        return update ? { ...photo, ...update.updates } : photo;
      });
    }

    let newSession = state.printSession;
    if (batch.settingsUpdates) {
      const validated = validatePrintSettings(batch.settingsUpdates);
      if (validated) {
        newSession = { ...state.printSession, ...validated };
      }
    }

    return {
      photos: newPhotos,
      printSession: newSession,
    };
  })
}));
