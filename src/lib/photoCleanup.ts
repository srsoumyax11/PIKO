import type { PhotoItem } from "../types/photo";

export function revokePhotoUrls(photo: PhotoItem): void {
  if (photo._blobUrlsToCleanup) {
    photo._blobUrlsToCleanup.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        console.error(`Failed to revoke blob URL: ${url}`, e);
      }
    });
  }
}

export function trackBlobUrl(photo: PhotoItem, url: string): void {
  if (!photo._blobUrlsToCleanup) {
    photo._blobUrlsToCleanup = [];
  }
  photo._blobUrlsToCleanup.push(url);
}
