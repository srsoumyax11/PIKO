import type { PhotoItem } from "../../../types/photo";
import { computeLayout, PAGE_SIZES, type PageSizeKey } from "../../../lib/layoutEngine";
import { Select } from "../../ui/Select";
import { Button } from "../../ui/Button";
import { ColorPicker } from "../../ui/ColorPicker";
import { getDisplayUrl } from "../../../lib/photoUtils";

interface LayoutPanelProps {
  photo: PhotoItem; // current active photo (for maxW fallback)
}

const INP: React.CSSProperties = {
  width: "100%", padding: "8px 12px",
  border: "1px solid var(--line)", borderRadius: "var(--radius-s)",
  fontFamily: "'Inter', sans-serif", backgroundColor: "var(--paper)",
  boxSizing: "border-box"
};

import { usePhotoStore } from "../../../store/usePhotoStore";

export function LayoutPanel({ photo }: LayoutPanelProps) {
  const photos = usePhotoStore(state => state.photos);
  const printSession = usePhotoStore(state => state.printSession);
  const updatePrintSettings = usePhotoStore(state => state.updatePrintSettings);
  const updatePhotoPrintSettings = usePhotoStore(state => state.updatePhotoPrintSettings);
  const printPhotos = photos.filter(p => (printSession.photoSettings[p.id]?.printCopies || 0) > 0);
  const totalCopies = photos.reduce((s, p) => s + (printSession.photoSettings[p.id]?.printCopies || 0), 0);
  const pageDim = PAGE_SIZES[printSession.pageSize];
  
  let maxW = 35;
  if (printPhotos.length > 0) {
    maxW = Math.max(...printPhotos.map(p => printSession.photoSettings[p.id]?.printSize.widthMm || 35));
  } else {
    maxW = printSession.photoSettings[photo?.id]?.printSize.widthMm || 35;
  }
  
  const avail = pageDim.w - printSession.marginMm * 2;
  const autoCols = Math.max(1, Math.floor((avail + printSession.gapMm) / (maxW + printSession.gapMm)));

  const layout = printPhotos.length > 0
    ? computeLayout(
      { ...printSession, cols: autoCols },
      printPhotos.map(p => {
        const s = printSession.photoSettings[p.id];
        return {
          photoId: p.id,
          widthMm: s?.printSize.widthMm || 35,
          heightMm: s?.printSize.heightMm || 45,
          copies: s?.printCopies || 0
        };
      })
    )
    : null;

  return (
    <div>
      <p className="panel-section-label">Page Settings</p>

      <div style={{ marginBottom: "12px" }}>
        <Select
          label="Page Size"
          value={printSession.pageSize}
          options={(Object.keys(PAGE_SIZES) as PageSizeKey[]).map(k => ({ value: k, label: PAGE_SIZES[k].label }))}
          onChangeValue={(val) => updatePrintSettings({ pageSize: val as PageSizeKey })}
        />
      </div>

      <p className="panel-section-label" style={{ marginTop: "20px" }}>Print Copies</p>
      <p style={{ fontSize: "11px", color: "var(--steel)", marginTop: "-6px", marginBottom: "14px" }}>
        Set to 0 to exclude a photo.
      </p>

      {photos.map(p => {
        const copies = printSession.photoSettings[p.id]?.printCopies || 0;
        return (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <div style={{ width: "36px", height: "48px", borderRadius: "4px", overflow: "hidden", flexShrink: 0, backgroundColor: "#f0f0f0", opacity: copies > 0 ? 1 : 0.35, transition: "opacity 0.2s" }}>
              <img src={getDisplayUrl(p)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <span style={{ fontSize: "11px", color: copies > 0 ? "var(--ink)" : "var(--steel)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "color 0.2s" }}>
              {p.originalFile.name}
            </span>
            <input
              type="number" min={0} max={99} value={copies}
              onChange={e => updatePhotoPrintSettings(p.id, { printCopies: Math.max(0, Number(e.target.value)) })}
              style={{ width: "52px", padding: "4px 8px", textAlign: "center", border: `1px solid ${copies > 0 ? "var(--focus)" : "var(--line)"}`, borderRadius: "var(--radius-s)", fontFamily: "'Inter',sans-serif", backgroundColor: "var(--paper)", fontWeight: copies > 0 ? "600" : "400" }}
            />
          </div>
        );
      })}

      <p className="panel-section-label" style={{ marginTop: "20px" }}>Border Settings</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
        <div>
          <label className="panel-section-label" style={{ fontSize: "11px", marginBottom: "6px", display: "block" }}>Border (mm)</label>
          <input type="number" min={0} max={20} step={0.5} value={printSession.borderMm || 0} onChange={e => updatePrintSettings({ borderMm: Number(e.target.value) })} style={{ ...INP, padding: "8px", boxSizing: "border-box" }} />
        </div>
        <div>
          <ColorPicker
            label="Color"
            value={printSession.borderColor || "#ffffff"}
            onChange={(val) => updatePrintSettings({ borderColor: val })}
          />
        </div>
      </div>

      <p className="panel-section-label" style={{ marginTop: "20px" }}>Layout Offsets</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
        <div>
          <label className="panel-section-label" style={{ fontSize: "11px", marginBottom: "6px", display: "block" }}>Margin (mm)</label>
          <input type="number" min={0} max={30} value={printSession.marginMm} onChange={e => updatePrintSettings({ marginMm: Number(e.target.value) })} style={{ ...INP, padding: "8px", boxSizing: "border-box" }} />
        </div>
        <div>
          <label className="panel-section-label" style={{ fontSize: "11px", marginBottom: "6px", display: "block" }}>Gap (mm)</label>
          <input type="number" min={0} max={20} value={printSession.gapMm} onChange={e => updatePrintSettings({ gapMm: Number(e.target.value) })} style={{ ...INP, padding: "8px", boxSizing: "border-box" }} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", marginTop: "16px" }}>
        <label className="panel-section-label" style={{ marginBottom: 0 }}>Cut Lines</label>
        <Button
          variant={printSession.showCutLines ? "primary" : "ghost"}
          onClick={() => updatePrintSettings({ showCutLines: !printSession.showCutLines })}
          style={{ padding: "4px 12px", fontSize: "12px" }}
        >
          {printSession.showCutLines ? "On" : "Off"}
        </Button>
      </div>

      <div style={{ padding: "12px 16px", backgroundColor: "var(--focus-dim)", borderRadius: "var(--radius-s)", fontSize: "12px", color: "var(--ink)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", paddingBottom: "6px", borderBottom: "1px solid var(--line)" }}>
          <span style={{ color: "var(--steel)" }}>Auto columns</span><strong>{autoCols} per row</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span>Total copies</span><strong>{totalCopies}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Pages needed</span><strong>{layout?.totalPages ?? "—"}</strong>
        </div>
      </div>
    </div>
  );
}
