import { usePhotoStore } from "../../store/usePhotoStore";
import { downloadPDF, downloadImage } from "../../lib/export";
import { Button } from "../ui/Button";

export function Topbar() {
  const photos = usePhotoStore(state => state.photos);
  const printSession = usePhotoStore(state => state.printSession);

  const selectedForPrint = photos.filter(p => {
    const settings = printSession.photoSettings[p.id];
    return settings && (settings.printCopies > 0 || settings.isSelectedForPrint);
  });
  // In the original App.tsx, we fallback to activePhoto if selectedForPrint is empty.
  // We can just rely on selectedForPrint or a prop if we want, but for now we'll 
  // do what the original did if we pass activePhotoId, or just print what's selected.
  // Since Topbar doesn't know activePhotoId easily without context changes, 
  // let's just print selected photos, which is standard.

  const handleDownloadPDF = () => {
    if (selectedForPrint.length > 0) {
      downloadPDF(selectedForPrint, printSession);
    } else if (photos.length > 0) {
      downloadPDF(photos, printSession);
    }
  };

  const handleDownloadImage = () => {
    if (selectedForPrint.length > 0) {
      downloadImage(selectedForPrint, printSession);
    } else if (photos.length > 0) {
      downloadImage(photos, printSession);
    }
  };

  return (
    <header className="app-header">
      <div className="wordmark" style={{ display: 'flex', alignItems: 'center' }}>
        <img src="/android-chrome-192x192.png" alt="Piko Logo" style={{ height: '60px', width: '60px', borderRadius: '4px' }} />
        Piko
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <Button
          variant="primary"
          style={{ backgroundColor: "#e81c4f", borderColor: "#e81c4f" }}
          disabled={photos.length === 0}
          onClick={handleDownloadPDF}
        >
          ↓ PDF {selectedForPrint.length > 0 ? `(${selectedForPrint.length})` : ""}
        </Button>
        <Button
          variant="primary"
          disabled={photos.length === 0}
          onClick={handleDownloadImage}
        >
          ↓ JPG {selectedForPrint.length > 0 ? `(${selectedForPrint.length})` : ""}
        </Button>
      </div>
    </header>
  );
}
