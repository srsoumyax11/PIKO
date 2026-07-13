import React, { useState, useEffect } from "react";
import type { PhotoItem } from "../../../types/photo";
import { Slider } from "../../ui/Slider";
import { usePhotoStore } from "../../../store/usePhotoStore";
import { SEO_COUNTRIES } from "../../../lib/seoData";

interface CropPanelProps {
  photo: PhotoItem;
  updatePhoto: (id: string, updates: Partial<PhotoItem>) => void;
}

export function CropPanel({ photo, updatePhoto }: CropPanelProps) {
  const printSession = usePhotoStore(state => state.printSession);
  const updatePhotoPrintSettings = usePhotoStore(state => state.updatePhotoPrintSettings);
  
  const currentSettings = printSession.photoSettings[photo.id];
  const printSizeName = currentSettings?.printSize?.name || "gen-2x2";
  const isCustom = printSizeName === "Custom";

  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("general");
  const [selectedDocId, setSelectedDocId] = useState<string>("gen-2x2");

  // Sync state with store on mount or when printSizeName changes from outside (e.g. initial URL load)
  useEffect(() => {
    if (printSizeName !== "Custom") {
      const foundCountry = SEO_COUNTRIES.find(c => c.documents.some(d => d.id === printSizeName));
      if (foundCountry) {
        setSelectedCountryCode(foundCountry.code);
        setSelectedDocId(printSizeName);
      }
    }
  }, [printSizeName]);

  const INP: React.CSSProperties = {
    width: "100%", padding: "10px 12px",
    border: "1px solid var(--line)", borderRadius: "var(--radius-s)",
    fontFamily: "'Inter', sans-serif", backgroundColor: "var(--paper)",
    boxSizing: "border-box", cursor: isCustom ? "not-allowed" : "pointer",
    opacity: isCustom ? 0.6 : 1,
    appearance: "none",
    backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235A6169' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    backgroundSize: "16px"
  };

  const activeCountry = SEO_COUNTRIES.find(c => c.code === selectedCountryCode) || SEO_COUNTRIES[0];

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    setSelectedCountryCode(newCode);
    const country = SEO_COUNTRIES.find(c => c.code === newCode);
    if (country && country.documents.length > 0) {
      const firstDoc = country.documents[0];
      setSelectedDocId(firstDoc.id);
      
      if (!isCustom) {
        updatePhotoPrintSettings(photo.id, {
          printSize: { name: firstDoc.id, widthMm: firstDoc.widthMm, heightMm: firstDoc.heightMm }
        });
        updatePhoto(photo.id, { croppedDataUrl: undefined, adjustedDataUrl: undefined });
      }
    }
  };

  const handleDocChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDocId = e.target.value;
    setSelectedDocId(newDocId);
    
    if (!isCustom) {
      const country = SEO_COUNTRIES.find(c => c.code === selectedCountryCode);
      const targetDoc = country?.documents.find(d => d.id === newDocId);
      if (targetDoc) {
        updatePhotoPrintSettings(photo.id, {
          printSize: { name: targetDoc.id, widthMm: targetDoc.widthMm, heightMm: targetDoc.heightMm }
        });
        updatePhoto(photo.id, { croppedDataUrl: undefined, adjustedDataUrl: undefined });
      }
    }
  };

  const handleCustomToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    if (checked) {
      updatePhotoPrintSettings(photo.id, {
        printSize: { name: "Custom", widthMm: currentSettings?.printSize?.widthMm || 35, heightMm: currentSettings?.printSize?.heightMm || 45 }
      });
    } else {
      // Revert to selected dropdown doc
      const country = SEO_COUNTRIES.find(c => c.code === selectedCountryCode);
      const targetDoc = country?.documents.find(d => d.id === selectedDocId);
      if (targetDoc) {
        updatePhotoPrintSettings(photo.id, {
          printSize: { name: targetDoc.id, widthMm: targetDoc.widthMm, heightMm: targetDoc.heightMm }
        });
      }
    }
    updatePhoto(photo.id, { croppedDataUrl: undefined, adjustedDataUrl: undefined });
  };

  // Find currently selected doc for dims display
  let selectedDocInfo = "";
  if (!isCustom) {
    const targetDoc = activeCountry.documents.find(d => d.id === selectedDocId);
    if (targetDoc) {
      selectedDocInfo = `${targetDoc.widthMm} × ${targetDoc.heightMm} mm`;
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
        <p className="panel-section-label" style={{ margin: 0 }}>Print Size</p>
        {selectedDocInfo && !isCustom && (
          <span style={{ fontSize: "11px", color: "var(--steel)", fontFamily: "'JetBrains Mono', monospace" }}>
            {selectedDocInfo}
          </span>
        )}
      </div>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <label className="panel-section-label" style={{ fontSize: "11px", marginBottom: "6px", display: "block", color: isCustom ? "var(--line)" : "inherit" }}>Country / Region</label>
          <select 
            value={selectedCountryCode} 
            onChange={handleCountryChange}
            style={INP}
            disabled={isCustom}
          >
            {SEO_COUNTRIES.map(country => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="panel-section-label" style={{ fontSize: "11px", marginBottom: "6px", display: "block", color: isCustom ? "var(--line)" : "inherit" }}>Document Format</label>
          <select 
            value={selectedDocId} 
            onChange={handleDocChange}
            style={INP}
            disabled={isCustom}
          >
            {activeCountry.documents.map(doc => (
              <option key={doc.id} value={doc.id}>
                {doc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
        <input 
          type="checkbox" 
          id="custom-crop-toggle"
          checked={isCustom}
          onChange={handleCustomToggle}
          style={{ width: "16px", height: "16px", cursor: "pointer" }}
        />
        <label htmlFor="custom-crop-toggle" style={{ fontSize: "14px", cursor: "pointer" }}>
          Use Custom Dimensions
        </label>
      </div>
      
      {isCustom && (
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "12px",
          animation: "slideDown 0.2s ease-out forwards"
        }}>
          <style>{`
            @keyframes slideDown {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <div>
            <label className="panel-section-label" style={{ fontSize: "11px", marginBottom: "6px", display: "block" }}>Width (mm)</label>
            <input 
              type="number" min={10} max={200} step={1} 
              value={currentSettings?.printSize?.widthMm || 35} 
              onChange={e => {
                updatePhotoPrintSettings(photo.id, {
                  printSize: { name: "Custom", widthMm: Number(e.target.value), heightMm: currentSettings?.printSize?.heightMm || 45 }
                });
                updatePhoto(photo.id, { croppedDataUrl: undefined, adjustedDataUrl: undefined });
              }} 
              style={{ ...INP, padding: "8px", boxSizing: "border-box", appearance: "auto", backgroundImage: "none", opacity: 1, cursor: "auto" }} 
            />
          </div>
          <div>
            <label className="panel-section-label" style={{ fontSize: "11px", marginBottom: "6px", display: "block" }}>Height (mm)</label>
            <input 
              type="number" min={10} max={200} step={1} 
              value={currentSettings?.printSize?.heightMm || 45} 
              onChange={e => {
                updatePhotoPrintSettings(photo.id, {
                  printSize: { name: "Custom", widthMm: currentSettings?.printSize?.widthMm || 35, heightMm: Number(e.target.value) }
                });
                updatePhoto(photo.id, { croppedDataUrl: undefined, adjustedDataUrl: undefined });
              }} 
              style={{ ...INP, padding: "8px", boxSizing: "border-box", appearance: "auto", backgroundImage: "none", opacity: 1, cursor: "auto" }} 
            />
          </div>
        </div>
      )}

      <div style={{ marginTop: "24px" }}>
        <Slider
          label="Zoom"
          value={Number((photo.zoom || 1).toFixed(2))}
          min={1}
          max={3}
          step={0.01}
          unit="×"
          onChange={(val) => updatePhoto(photo.id, { zoom: val })}
        />
      </div>

      <div style={{ marginTop: "12px" }}>
        <Slider
          label="Straighten"
          value={photo.rotation || 0}
          min={-45}
          max={45}
          step={1}
          unit="°"
          onChange={(val) => updatePhoto(photo.id, { rotation: val, croppedDataUrl: undefined, adjustedDataUrl: undefined })}
        />
      </div>
    </div>
  );
}
