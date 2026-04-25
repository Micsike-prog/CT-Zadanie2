import { SEVERITY_CONFIG } from "../../constants/severity";
import { SeverityBadge } from "../ui/SeverityBadge";

export function DetectionList({ results, onSave }) {
  const avgConfidence = results.length
    ? Math.round(results.reduce((s, r) => s + r.confidence, 0) / results.length * 100)
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Detekcie */}
      <div style={{ background: "#fff", border: "1px solid #E8E7E2", borderRadius: 16, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 14, textTransform: "uppercase", letterSpacing: ".06em" }}>
          Detekované objekty
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {results.length === 0 && (
            <div style={{ padding: 14, background: "#F7F6F2", borderRadius: 10, color: "#777", fontSize: 13 }}>
              Model na snímke nenašiel žiadne diery.
            </div>
          )}
          {results.map((r) => {
            const cfg = SEVERITY_CONFIG[r.severity];
            return (
              <div key={r.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 14px", background: cfg.bg, borderRadius: 10,
                border: `1px solid ${cfg.color}22`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 5, background: cfg.dot }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>Diera #{r.id}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>{r.w}×{r.h} px</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: cfg.color, fontFamily: "'DM Mono', monospace" }}>
                    {Math.round(r.confidence * 100)}%
                  </div>
                  <SeverityBadge severity={r.severity} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Súhrn */}
      <div style={{ background: "#fff", border: "1px solid #E8E7E2", borderRadius: 16, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 14, textTransform: "uppercase", letterSpacing: ".06em" }}>
          Súhrn
        </div>
        {[
          ["Celkový počet", results.length],
          ["Vysoká závažnosť", results.filter(r => r.severity === "high").length],
          ["Priem. spoľahlivosť", `${avgConfidence}%`],
          ["Stav uloženia", "Uložené"],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F0EFE9" }}>
            <span style={{ fontSize: 13, color: "#777" }}>{k}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111", fontFamily: "'DM Mono', monospace" }}>{v}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onSave}
        style={{ background: "#111", color: "#fff", border: "none", borderRadius: 10, padding: "14px 24px", fontSize: 15, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}
      >
        Zobraziť históriu
      </button>
    </div>
  );
}
