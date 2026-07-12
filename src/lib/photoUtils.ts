import type { PhotoItem } from "../types/photo";

/**
 * Returns the single correct display URL for a photo, representing
 * the highest-quality processed version available.
 *
 * Cascade order (highest priority first):
 *   adjustedDataUrl → croppedDataUrl → bgRemovedDataUrl (if active) → originalDataUrl
 *
 * Use this in every component: Gallery, Filmstrip, Preview, Export.
 */
export function getDisplayUrl(photo: PhotoItem): string {
  return (
    photo.adjustedDataUrl ||
    photo.croppedDataUrl ||
    (photo.bgRemoved && photo.bgRemovedDataUrl ? photo.bgRemovedDataUrl : null) ||
    photo.originalDataUrl
  );
}

/**
 * Returns the correct full-size image to use as input for the Crop stage.
 * If BG was removed and the cache exists, use the transparent version.
 * Otherwise fall back to the original.
 */
export function getSourceForCrop(photo: PhotoItem): string {
  return photo.bgRemoved && photo.bgRemovedDataUrl
    ? photo.bgRemovedDataUrl
    : photo.originalDataUrl;
}
