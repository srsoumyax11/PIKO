import { useEffect, useRef, useState } from "react";
import { getCroppedImg, getSharpenedImg } from "../../../lib/canvas";
import { getSourceForCrop } from "../../../lib/photoUtils";
import { removeBg } from "../../../lib/bgRemoval";
import type { PhotoItem } from "../../../types/photo";

export function usePhotoPipeline(photo: PhotoItem | undefined, updatePhoto: (id: string, updates: Partial<PhotoItem>) => void) {
  const cropTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const adjustTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelBgRef = useRef<boolean>(false);
  
  const [bgProgress, setBgProgress] = useState("");
  const [isRemovingBg, setIsRemovingBg] = useState(false);

  // Layer 2: regenerate croppedDataUrl after crop/rotation/bg changes
  useEffect(() => {
    if (!photo || !photo.cropRect) return;
    if (cropTimerRef.current) clearTimeout(cropTimerRef.current);
    
    cropTimerRef.current = setTimeout(async () => {
      try {
        const src = getSourceForCrop(photo);
        const cropped = await getCroppedImg(src, photo.cropRect!, photo.rotation || 0);
        updatePhoto(photo.id, { croppedDataUrl: cropped, adjustedDataUrl: undefined, status: "cropped" });
      } catch (e) {
        console.error("Crop failed:", e);
      }
    }, 400);

    return () => {
      if (cropTimerRef.current) clearTimeout(cropTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo?.id, photo?.cropRect, photo?.rotation, photo?.bgRemoved, photo?.bgRemovedDataUrl, updatePhoto]);

  // Layer 3: regenerate adjustedDataUrl when sharpen changes
  useEffect(() => {
    if (!photo) return;
    if (adjustTimerRef.current) clearTimeout(adjustTimerRef.current);

    if (!photo.sharpenAmount || photo.sharpenAmount <= 0) {
      updatePhoto(photo.id, { adjustedDataUrl: undefined });
      return;
    }

    if (!photo.croppedDataUrl) return;

    adjustTimerRef.current = setTimeout(async () => {
      try {
        const sharpened = await getSharpenedImg(photo.croppedDataUrl!, photo.sharpenAmount || 0);
        updatePhoto(photo.id, { adjustedDataUrl: sharpened, status: "adjusted" });
      } catch (e) {
        console.error("Sharpen failed:", e);
      }
    }, 400);

    return () => {
      if (adjustTimerRef.current) clearTimeout(adjustTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo?.id, photo?.sharpenAmount, photo?.croppedDataUrl, updatePhoto]);

  // BG removal handlers
  const handleRemoveBg = async () => {
    if (!photo) return;
    setIsRemovingBg(true);
    cancelBgRef.current = false;
    setBgProgress("Initializing AI...");
    
    try {
      const url = await removeBg(photo.originalDataUrl, (progress) => {
        setBgProgress(progress);
      });
      if (cancelBgRef.current) return;
      setBgProgress("Finishing up...");
      await new Promise(r => setTimeout(r, 300));
      updatePhoto(photo.id, {
        bgRemoved: true,
        bgRemovedDataUrl: url,
        bgColor: photo.bgColor || "#ffffff",
        croppedDataUrl: undefined,
        adjustedDataUrl: undefined,
        status: "bg-processed",
      });
    } catch (e) {
      console.error("BG removal failed", e);
    } finally {
      setIsRemovingBg(false);
      setBgProgress("");
    }
  };

  const handleCancelBg = () => {
    cancelBgRef.current = true;
    setIsRemovingBg(false);
    setBgProgress("");
  };

  const handleRestoreBg = () => {
    if (!photo) return;
    updatePhoto(photo.id, { bgRemoved: false, croppedDataUrl: undefined, adjustedDataUrl: undefined });
  };

  const handleReapplyBg = () => {
    if (!photo?.bgRemovedDataUrl) return;
    updatePhoto(photo.id, { bgRemoved: true, croppedDataUrl: undefined, adjustedDataUrl: undefined });
  };

  return {
    bgProgress,
    isRemovingBg,
    handleRemoveBg,
    handleCancelBg,
    handleRestoreBg,
    handleReapplyBg,
  };
}
