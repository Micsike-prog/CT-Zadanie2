export function Header({ view, onNavigate }) {
  return (
    <header style={{
      background: "#fff", borderBottom: "1px solid #E8E7E2",
      position: "sticky", top: 0, zIndex: 50,
    }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto", padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between", height: 64,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: "#111", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 3" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#111", letterSpacing: "-.02em" }}>PotholeAI</div>
            <div style={{ fontSize: 11, color: "#999", marginTop: -1 }}>Detekcia dier na cestách</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", gap: 4 }}>
          {[["upload", "Nahrať"], ["history", "História"], ["map", "Mapa"]].map(([v, label]) => {
            const active = view === v || (v === "upload" && view === "results");
            return (
              <button
                key={v}
                onClick={() => onNavigate(v)}
                style={{
                  background: active ? "#111" : "none",
                  color: active ? "#fff" : "#666",
                  border: "none", cursor: "pointer",
                  padding: "10px 18px", borderRadius: 8,
                  fontSize: 14, fontWeight: 500, fontFamily: "inherit",
                  transition: "all .2s",
                }}
              >
                {label}
              </button>
            );
          })}
        </nav>

        
      </div>
    </header>
  );
}
