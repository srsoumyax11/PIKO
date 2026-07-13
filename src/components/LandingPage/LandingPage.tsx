import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SEO_COUNTRIES, generateSlug } from '../../lib/seoData';
import { APP_DOMAIN } from '../../lib/constants';
import { Button } from '../ui/Button';

export function LandingPage() {
  const canonicalUrl = `${APP_DOMAIN}/`;
  const title = "Piko - Free Online Passport Photo Maker & Editor";
  const description = "Create professional passport, visa, and ID photos for free. Piko is a private, local-first web app that automatically removes backgrounds and generates print-ready sheets instantly in your browser.";
  const imageUrl = `${APP_DOMAIN}/social-banner.png`;

  return (
    <div className="landing-page" style={{ 
      color: "var(--text)", 
      fontFamily: "'Inter', sans-serif",
      backgroundColor: "var(--bg)",
      minHeight: "100vh"
    }}>
      <Helmet>
        <title>{title}</title>
        <link rel="canonical" href={canonicalUrl} />
        <meta name="title" content={title} />
        <meta name="description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={imageUrl} />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:description" content={description} />
        <meta property="twitter:image" content={imageUrl} />
      </Helmet>
      {/* Navbar */}
      <nav style={{ 
        display: "flex", justifyContent: "space-between", alignItems: "center", 
        padding: "24px 40px", maxWidth: "1200px", margin: "0 auto" 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontFamily: "'Space Grotesk', sans-serif", fontSize: "24px", fontWeight: "bold" }}>
          <img src="/android-chrome-192x192.png" alt="PIKO Logo" style={{ width: "40px", height: "40px", borderRadius: "8px" }} />
          Piko
        </div>
        <div>
          <Link to="/gen-2x2-photo-maker">
            <Button variant="primary" style={{ backgroundColor: "#e81c4f", borderColor: "#e81c4f", color: "white" }}>
              Open Editor
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{ 
        textAlign: "center", padding: "80px 24px", maxWidth: "900px", margin: "0 auto" 
      }}>
        <div style={{ 
          display: "inline-block", padding: "6px 16px", backgroundColor: "var(--paper-raised)", 
          borderRadius: "100px", fontSize: "14px", fontWeight: 600, color: "var(--accent)",
          marginBottom: "24px", border: "1px solid var(--line)"
        }}>
          ✨ 100% Free & Open Source
        </div>
        <h1 style={{ 
          fontFamily: "'Space Grotesk', sans-serif", fontSize: "64px", 
          lineHeight: "1.1", marginBottom: "24px", letterSpacing: "-0.02em" 
        }}>
          The ultimate passport photo studio in your browser.
        </h1>
        <p style={{ 
          fontSize: "22px", color: "var(--steel)", maxWidth: "700px", 
          margin: "0 auto 40px", lineHeight: "1.5" 
        }}>
          Create perfect biometric passport, visa, and ID photos instantly. 
          Powered by AI background removal that runs entirely locally on your device for absolute privacy.
        </p>
        <Link to="/gen-2x2-photo-maker">
          <Button variant="primary" style={{ 
            padding: "16px 32px", fontSize: "20px", height: "auto",
            backgroundColor: "#e81c4f", borderColor: "#e81c4f", borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(232, 28, 79, 0.25)"
          }}>
            Create Your Photo Now
          </Button>
        </Link>
        <p style={{ marginTop: "16px", fontSize: "14px", color: "var(--steel)" }}>
          No signup required. No images uploaded to the cloud.
        </p>
      </header>

      {/* Feature Grid */}
      <section style={{ backgroundColor: "var(--paper)", padding: "80px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "36px", textAlign: "center", marginBottom: "60px" }}>
            Why choose Piko?
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px" }}>
            
            <div style={{ padding: "32px", backgroundColor: "var(--bg)", borderRadius: "24px", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: "32px", marginBottom: "16px" }}>🔒</div>
              <h3 style={{ fontSize: "20px", marginBottom: "12px", fontFamily: "'Space Grotesk', sans-serif" }}>100% Private & Local</h3>
              <p style={{ color: "var(--steel)", lineHeight: "1.6" }}>
                Unlike other tools, your sensitive ID photos never leave your computer. Everything, including AI processing, happens directly in your browser.
              </p>
            </div>

            <div style={{ padding: "32px", backgroundColor: "var(--bg)", borderRadius: "24px", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: "32px", marginBottom: "16px" }}>✨</div>
              <h3 style={{ fontSize: "20px", marginBottom: "12px", fontFamily: "'Space Grotesk', sans-serif" }}>AI Background Removal</h3>
              <p style={{ color: "var(--steel)", lineHeight: "1.6" }}>
                Instantly strip away messy backgrounds and replace them with the exact compliant white, cream, or blue background required by embassies.
              </p>
            </div>

            <div style={{ padding: "32px", backgroundColor: "var(--bg)", borderRadius: "24px", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: "32px", marginBottom: "16px" }}>🖨️</div>
              <h3 style={{ fontSize: "20px", marginBottom: "12px", fontFamily: "'Space Grotesk', sans-serif" }}>Print-Ready Layouts</h3>
              <p style={{ color: "var(--steel)", lineHeight: "1.6" }}>
                Stop paying for photo booths. Piko automatically arranges your cropped photos onto standard 4x6" or A4 sheets with perfect cut-lines, ready to print anywhere.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Supported Formats SEO Directory */}
      <section style={{ padding: "80px 24px", maxWidth: "1200px", margin: "0 auto" }}>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "36px", textAlign: "center", marginBottom: "16px" }}>
          Supported Global Formats
        </h2>
        <p style={{ textAlign: "center", color: "var(--steel)", marginBottom: "48px", maxWidth: "600px", margin: "0 auto 48px" }}>
          We support strict biometric guidelines for dozens of countries. Select your document type below to auto-configure the editor.
        </p>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
          {SEO_COUNTRIES.map((country) => (
            <div key={country.code} style={{ 
              backgroundColor: "var(--paper-raised)", 
              padding: "32px", 
              borderRadius: "20px",
              border: "1px solid var(--line)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
            }}>
              <h3 style={{ marginTop: 0, marginBottom: "20px", fontSize: "22px", fontFamily: "'Space Grotesk', sans-serif", display: "flex", alignItems: "center", gap: "8px" }}>
                {country.name}
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                {country.documents.map(doc => {
                  const slug = generateSlug(doc.id);
                  return (
                    <li key={slug}>
                      <Link 
                        to={`/${slug}`} 
                        style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500, display: "block", padding: "8px", borderRadius: "8px", transition: "background 0.2s", margin: "-8px" }}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "var(--line)" }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
                      >
                        <div style={{ color: "var(--text)" }}>{doc.name}</div>
                        <div style={{ fontSize: "12px", color: "var(--steel)", marginTop: "4px" }}>{doc.widthMm}x{doc.heightMm}mm • Aspect Ratio: {doc.aspectRatio}</div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--line)", padding: "40px 24px", textAlign: "center", color: "var(--steel)" }}>
        <p>© {new Date().getFullYear()} Piko. Created for free public use.</p>
      </footer>
    </div>
  );
}
