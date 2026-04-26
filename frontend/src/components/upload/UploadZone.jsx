import { useRef, useState } from "react";

export function UploadZone({ imageURL, analyzing, onFile, onReset }) {
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    onFile(e.dataTransfer.files[0]);
  };

  return (
    <div
      onClick={() => !imageURL && fileRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      style={{
        minHeight: 280, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        cursor: imageURL ? "default" : "pointer",
        position: "relative", overflow: "hidden",
        border: `2px dashed ${dragOver ? "#111" : "#D0CFC9"}`,
        borderRadius: 16,
        background: imageURL ? "#000" : dragOver ? "#F0EFEB" : "#FAFAF8",
        transition: "all .25s",
      }}
    >
      {imageURL ? (
        <>
          <img
            src={imageURL}
            alt="preview"
            style={{ width: "100%", height: "100%", objectFit: "contain", opacity: analyzing ? .55 : 1, transition: "opacity .3s" }}
          />
          {analyzing && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
              <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                <div style={{
                  position: "absolute", left: 0, right: 0, height: 2,
                  background: "linear-gradient(90deg, transparent, #E8432D, transparent)",
                  animation: "scanMove 1.8s ease-in-out infinite",
                }} />
              </div>
              <div style={{ width: 36, height: 36, border: "3px solid #E8E7E2", borderTopColor: "#111", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 500, background: "rgba(0,0,0,.6)", padding: "6px 16px", borderRadius: 20 }}>
                Analyzujem…
              </span>
            </div>
          )}
          {!analyzing && (
            <button
              onClick={(e) => { e.stopPropagation(); onReset(); }}
              style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,.6)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}
            >
              Zrušiť
            </button>
          )}
        </>
      ) : (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ width: 56, height: 56, background: "#EDECE8", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#333", marginBottom: 6 }}>Presuňte fotografiu sem</div>
          <div style={{ fontSize: 13, color: "#999" }}>alebo kliknite pre výber súboru · JPG, PNG, HEIC</div>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => onFile(e.target.files[0])} />
    </div>
  );
}
