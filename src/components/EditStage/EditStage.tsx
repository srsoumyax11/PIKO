import { useEffect } from "react";
import { usePhotoStore } from "../../store/usePhotoStore";
import { usePhotoPipeline } from "./hooks/usePhotoPipeline";
import { SEO_COUNTRIES } from "../../lib/seoData";

// Workspaces
import { CropWorkspace } from "./workspaces/CropWorkspace";
import { BackgroundWorkspace } from "./workspaces/BackgroundWorkspace";
import { PreviewWorkspace } from "./workspaces/PreviewWorkspace";
import { LayoutWorkspace } from "./workspaces/LayoutWorkspace";

// Panels
import { CropPanel } from "./panels/CropPanel";
import { BackgroundPanel } from "./panels/BackgroundPanel";
import { AdjustPanel } from "./panels/AdjustPanel";
import { CaptionPanel } from "./panels/CaptionPanel";
import { LayoutPanel } from "./panels/LayoutPanel";

interface EditStageProps {
  photoId: string;
  activeTab: string;
  initialDocId?: string;
}

export function EditStage({ photoId, activeTab, initialDocId }: EditStageProps) {
  const photo = usePhotoStore(state => state.photos.find(p => p.id === photoId));
  const updatePhoto = usePhotoStore(state => state.updatePhoto);
  const printSession = usePhotoStore(state => state.printSession);
  const updatePhotoPrintSettings = usePhotoStore(state => state.updatePhotoPrintSettings);

  // If we have SEO-driven initial doc ID, apply it to the photo settings on first mount
  useEffect(() => {
    if (photo && initialDocId) {
      const currentSettings = printSession.photoSettings[photo.id];
      if (!currentSettings || currentSettings.printSize.name === "Passport") {
        // Find the document
        let targetDoc = null;
        for (const country of SEO_COUNTRIES) {
          const found = country.documents.find(d => d.id === initialDocId);
          if (found) {
            targetDoc = found;
            break;
          }
        }
        
        if (targetDoc) {
          updatePhotoPrintSettings(photo.id, {
            printSize: { name: targetDoc.id, widthMm: targetDoc.widthMm, heightMm: targetDoc.heightMm }
          });
        }
      }
    }
  }, [photo, initialDocId, printSession.photoSettings, updatePhotoPrintSettings]);

  // Hook handles Layer 2/3 cache generation and AI bg removal
  const {
    bgProgress,
    isRemovingBg,
    handleRemoveBg,
    handleCancelBg,
    handleRestoreBg,
    handleReapplyBg,
  } = usePhotoPipeline(photo, updatePhoto);

  if (!photo) return null;

  const currentSettings = printSession.photoSettings[photo.id];
  const w = currentSettings?.printSize?.widthMm || 35;
  const h = currentSettings?.printSize?.heightMm || 45;
  const aspect = w > 0 && h > 0 ? w / h : 1;

  // ── Main workspace area ──
  const renderWorkspace = () => {
    if (activeTab === "Layout") {
      return <LayoutWorkspace photo={photo} />;
    }
    if (activeTab === "Crop") {
      return <CropWorkspace photo={photo} aspect={aspect} updatePhoto={updatePhoto} />;
    }
    if (activeTab === "Background") {
      return <BackgroundWorkspace photo={photo} isRemovingBg={isRemovingBg} bgProgress={bgProgress} />;
    }
    // Adjust / Caption / other tabs: passport-aspect framed preview
    return <PreviewWorkspace photo={photo} aspect={aspect} />;
  };

  // ── Right-panel routing ──
  const renderPanel = () => {
    let content = null;
    if (activeTab === "Crop") {
      content = <CropPanel photo={photo} updatePhoto={updatePhoto} />;
    } else if (activeTab === "Background") {
      content = (
        <BackgroundPanel 
          photo={photo} 
          updatePhoto={updatePhoto} 
          isRemovingBg={isRemovingBg}
          handleRemoveBg={handleRemoveBg}
          handleCancelBg={handleCancelBg}
          handleRestoreBg={handleRestoreBg}
          handleReapplyBg={handleReapplyBg}
        />
      );
    } else if (activeTab === "Adjust") {
      content = <AdjustPanel photo={photo} updatePhoto={updatePhoto} />;
    } else if (activeTab === "Caption") {
      content = <CaptionPanel photo={photo} updatePhoto={updatePhoto} />;
    } else if (activeTab === "Layout") {
      content = (
        <LayoutPanel 
          photo={photo} 
        />
      );
    }

    if (!content) return null;

    return (
      <>
        <div className="right-panel-header">{activeTab}</div>
        <div className="right-panel-content">
          {content}
        </div>
      </>
    );
  };

  return (
    <>
      <section
        className="app-workspace"
        style={{
          position: "relative",
          ...(activeTab === "Layout" || activeTab === "Background" ? { padding: 0 } : {}),
        }}
      >
        {renderWorkspace()}
      </section>
      
      <aside className="app-sidebar-right">
        {renderPanel()}
      </aside>
    </>
  );
}
