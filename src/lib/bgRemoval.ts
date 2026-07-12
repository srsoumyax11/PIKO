import { removeBackground } from "@imgly/background-removal";

export async function removeBg(
  imageSource: string | Blob, 
  onProgress: (progress: string) => void
): Promise<string> {
  const config = {
    progress: (key: string, current: number, total: number) => {
      const percent = Math.round((current / total) * 100);
      if (key.includes("fetch")) {
        onProgress(`Downloading AI Model... ${percent}% (One-time, will be cached)`);
      } else if (key.includes("compute")) {
        onProgress(`Removing background... ${percent}%`);
      } else {
        onProgress(`Processing... ${percent}%`);
      }
    }
  };
  
  // Changed from imglyRemoveBackground to removeBackground
  const blob = await removeBackground(imageSource, config);
  
  return URL.createObjectURL(blob);
}