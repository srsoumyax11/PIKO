import { useState, useEffect } from "react";
import { usePhotoStore } from "./store/usePhotoStore";
import { ImportStage } from "./components/ImportStage/ImportStage";
import { PhotoThumbnailGrid } from "./components/PhotoThumbnailGrid/PhotoThumbnailGrid";
import { EditStage } from "./components/EditStage/EditStage";
import { FooterFilmstrip } from "./components/FooterFilmstrip/FooterFilmstrip";
import { Topbar } from "./components/layout/Topbar";
import { SidebarLeft } from "./components/layout/SidebarLeft";
import { TABS, APP_DOMAIN } from "./lib/constants";
import { Button } from "./components/ui/Button";
import "./layout.css";

import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Analytics } from '@vercel/analytics/react';
import { getSeoDataFromSlug, getPageTitle, getPageDescription, getPageKeywords } from './lib/seoData';
import { LandingPage } from './components/LandingPage/LandingPage';

function AppShell({ initialDocId }: { initialDocId?: string }) {
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Import");
  const photos = usePhotoStore(state => state.photos);

  const activePhoto = photos.find(p => p.id === activePhotoId);

  // Auto-select first photo and move to Background tab on first import
  useEffect(() => {
    if (photos.length > 0 && !activePhotoId) {
      setActivePhotoId(photos[0].id);
      setActiveTab("Background");
    }
  }, [photos, activePhotoId]);

  const currentTabIndex = TABS.findIndex(t => t.id === activeTab);
  const isLastTab = currentTabIndex === TABS.length - 1;

  const handleNextTab = () => {
    if (currentTabIndex < TABS.length - 1) {
      setActiveTab(TABS[currentTabIndex + 1].id);
    }
  };

  return (
    <div className="app-layout">
      <Topbar />

      <main className="app-main">
        <SidebarLeft activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "Import" ? (
          <>
            <section className="app-workspace">
              <div style={{
                width: "100%", maxWidth: "540px", padding: "48px",
                backgroundColor: "white", borderRadius: "24px",
                boxShadow: "0 12px 48px rgba(0,0,0,0.06)", border: "1px solid var(--line)",
                display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
              }}>
                <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "28px", marginBottom: "8px", marginTop: 0 }}>
                  Upload your photos
                </h1>
                <p style={{ color: "var(--steel)", marginBottom: "32px", fontSize: "14px" }}>
                  Import one or more photos. We recommend clear, front-facing shots with good lighting.
                </p>
                <div style={{ width: "100%" }}>
                  <ImportStage />
                </div>
              </div>
            </section>
            <aside className="app-sidebar-right">
              <div className="right-panel-header">Gallery</div>
              <div className="right-panel-content">
                <PhotoThumbnailGrid onPhotoSelect={(id) => {
                  setActivePhotoId(id);
                  setActiveTab("Background");
                }} />
                {photos.length === 0 && (
                  <p className="panel-copy" style={{ textAlign: "center", marginTop: "40px" }}>
                    No photos imported yet.
                  </p>
                )}
              </div>
            </aside>
          </>
        ) : !activePhotoId ? (
          <section className="app-workspace">
            <div style={{ textAlign: "center" }}>
              <p className="panel-copy" style={{ marginBottom: "16px" }}>Please import and select a photo first.</p>
              <Button variant="primary" onClick={() => setActiveTab("Import")}>Go to Import</Button>
            </div>
          </section>
        ) : (
          <EditStage 
            photoId={activePhotoId} 
            activeTab={activeTab} 
            initialDocId={initialDocId} 
          />
        )}
      </main>

      <footer className="app-footer" style={{ padding: 0 }}>
        <div style={{ display: "flex", width: "100%", alignItems: "stretch", height: "100%" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <FooterFilmstrip
              activePhotoId={activePhotoId}
              onSelect={(id) => setActivePhotoId(id)}
            />
          </div>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 24px", borderLeft: "1px solid var(--line)",
            backgroundColor: "var(--paper-raised)", gap: "8px",
          }}>
            {!isLastTab && activePhotoId && (
              <Button
                variant="primary"
                onClick={handleNextTab}
                style={{ minWidth: "110px" }}
              >
                {activeTab === "Background" && !activePhoto?.bgRemoved ? "Skip →" : "Next →"}
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

function EditorRoute() {
  const { slug } = useParams();
  
  if (!slug) {
    return <LandingPage />;
  }

  const seoData = getSeoDataFromSlug(slug);
  
  // If slug doesn't match any known combinations, fallback to general
  if (!seoData) {
    return <Navigate to="/" replace />;
  }

  const title = getPageTitle(seoData.country, seoData.doc);
  const description = getPageDescription(seoData.country, seoData.doc);
  const keywords = getPageKeywords(seoData.country, seoData.doc);

  const canonicalUrl = `${APP_DOMAIN}/${slug}`;
  const imageUrl = `${APP_DOMAIN}/social-banner.png`;

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <link rel="canonical" href={canonicalUrl} />
        <meta name="title" content={title} />
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={imageUrl} />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:description" content={description} />
        <meta property="twitter:image" content={imageUrl} />
      </Helmet>
      <AppShell initialDocId={seoData.doc.id} />
    </>
  );
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/:slug" element={<EditorRoute />} />
      </Routes>
      <Analytics />
    </>
  );
}

export default App;
