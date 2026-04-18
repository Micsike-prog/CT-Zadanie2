import { useState } from "react";
import { Header } from "./components/layout/Header";
import { UploadZone } from "./components/upload/UploadZone";
import { MetadataForm } from "./components/upload/MetadataForm";
import { AnnotatedImage } from "./components/results/AnnotatedImage";
import { DetectionList } from "./components/results/DetectionList";
import { HistoryTable } from "./components/history/HistoryTable";
import { PotholeMap } from "./components/map/PotholeMap";
import { StatCard } from "./components/ui/StatCard";
import { useDetection } from "./hooks/useDetection";
import { STATS } from "./constants/severity";
import { saveDetection } from "./services/api";

const DEFAULT_METADATA = { location: "", date: new Date().toISOString().slice(0, 10), roadType: "mestska" };

export default function App() {
  const [view, setView] = useState("upload");
  const [metadata, setMetadata] = useState(DEFAULT_METADATA);

  const { image, imageURL, analyzing, results, error, handleFile, handleAnalyze, reset } = useDetection();

  const handleMetaChange = (key, value) => setMetadata((m) => ({ ...m, [key]: value }));

  const resetAll = () => {
    reset();
    setMetadata({ ...DEFAULT_METADATA, date: new Date().toISOString().slice(0, 10) });
  };

  const handleNavigate = (v) => {
    if (v === "upload") resetAll();
    setView(v);
  };

  // Ak je výsledok k dispozícii, zobraz results view
  const activeView = results ? "results" : view;

  const handleSave = async () => {
    try {
      await saveDetection({ results, metadata });
      alert("Uložené do databázy ✓");
    } catch (e) {
      alert("Chyba pri ukladaní: " + e.message);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F7F6F2", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes fadeUp   { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.45} }
        @keyframes scanMove { 0%{top:0;opacity:0} 15%{opacity:1} 85%{opacity:1} 100%{top:100%;opacity:0} }
        .fade-up { animation: fadeUp .4s ease both; }
      `}</style>

      <Header view={activeView} onNavigate={handleNavigate} />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>

        {/* Štatistiky — skryté na results view */}
        {activeView !== "results" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 40 }} className="fade-up">
            {STATS.map((s) => <StatCard key={s.label} {...s} />)}
          </div>
        )}

        {/* UPLOAD VIEW */}
        {activeView === "upload" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 28 }} className="fade-up">
            <div>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 28, fontWeight: 600, color: "#111", letterSpacing: "-.03em", marginBottom: 6 }}>Nová detekcia</h1>
                <p style={{ fontSize: 15, color: "#777", lineHeight: 1.6 }}>Nahrajte fotografiu cesty. AI model automaticky identifikuje a klasifikuje diery.</p>
              </div>
              <UploadZone imageURL={imageURL} analyzing={analyzing} onFile={handleFile} onReset={reset} />
              {error && <p style={{ marginTop: 12, color: "#E8432D", fontSize: 14 }}>{error}</p>}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ background: "#fff", border: "1px solid #E8E7E2", borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 16, textTransform: "uppercase", letterSpacing: ".06em" }}>Metadáta snímky</div>
                <MetadataForm values={metadata} onChange={handleMetaChange} />
              </div>

              <div style={{ background: "#F7F6F2", border: "1px solid #E8E7E2", borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 500 }}>Model</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 4 }}>YOLOv8-medium</div>
                <div style={{ fontSize: 12, color: "#999" }}>Confidence threshold: 0.45 · IoU: 0.50</div>
              </div>

              <button
                onClick={() => handleAnalyze(metadata)}
                disabled={!imageURL || analyzing}
                style={{
                  background: "#111", color: "#fff", border: "none", borderRadius: 10,
                  padding: "14px 32px", fontSize: 16, fontWeight: 600, fontFamily: "inherit",
                  cursor: imageURL && !analyzing ? "pointer" : "not-allowed",
                  opacity: !imageURL || analyzing ? .45 : 1,
                  transition: "all .2s",
                }}
              >
                {analyzing ? "Analyzujem…" : "Spustiť detekciu"}
              </button>
            </div>
          </div>
        )}

        {/* RESULTS VIEW */}
        {activeView === "results" && results && (
          <div className="fade-up">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 600, color: "#111", letterSpacing: "-.03em", marginBottom: 4 }}>Výsledky detekcie</h1>
                <p style={{ fontSize: 14, color: "#888" }}>Nájdených {results.length} dier · {new Date().toLocaleDateString("sk-SK")}</p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={resetAll} style={{ background: "#fff", color: "#111", border: "1.5px solid #E0DFD8", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 500, fontFamily: "inherit", cursor: "pointer" }}>
                  Nová analýza
                </button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28 }}>
              <div style={{ background: "#fff", border: "1px solid #E8E7E2", borderRadius: 16, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #E8E7E2", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>Anotovaný snímok</span>
                  <span style={{ fontSize: 12, color: "#999" }}>YOLOv8 · 892 ms</span>
                </div>
                <AnnotatedImage imageURL={imageURL} results={results} />
              </div>
              <DetectionList results={results} onSave={handleSave} />
            </div>
          </div>
        )}

        {/* HISTORY VIEW */}
        {activeView === "history" && <div className="fade-up"><HistoryTable /></div>}

        {/* MAP VIEW */}
        {activeView === "map" && <div className="fade-up"><PotholeMap /></div>}
      </main>
    </div>
  );
}
