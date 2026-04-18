import { SEVERITY_CONFIG } from "../../constants/severity";
import { SeverityBadge } from "../ui/SeverityBadge";

export function MapFilters({ filters, onToggle, days, onDaysChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Závažnosť */}
      <div className="card" style={{ padding: 20 }}>
        <div className="section-label">Filter závažnosti</div>
        {["high", "medium", "low"].map((s) => (
          <label
            key={s}
            style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, cursor: "pointer" }}
          >
            <input
              type="checkbox"
              checked={filters[s]}
              onChange={() => onToggle(s)}
              style={{ accentColor: SEVERITY_CONFIG[s].color, width: 16, height: 16 }}
            />
            <SeverityBadge severity={s} />
          </label>
        ))}

        {/* Časové obdobie */}
        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 12, color: "var(--color-text-muted)", display: "block", marginBottom: 6 }}>
            Časové obdobie
          </label>
          <select value={days} onChange={(e) => onDaysChange(e.target.value)}>
            <option value="7">Posledných 7 dní</option>
            <option value="30">Posledných 30 dní</option>
            <option value="365">Tento rok</option>
          </select>
        </div>
      </div>

      {/* Legenda */}
      <div className="card" style={{ padding: 20 }}>
        <div className="section-label">Legenda</div>
        {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => (
          <div
            key={key}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 12, height: 12, borderRadius: 6,
                background: cfg.color,
                border: "2px solid #fff",
                boxShadow: `0 0 0 1px ${cfg.color}`,
              }} />
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                {cfg.label} závažnosť
              </span>
            </div>
          </div>
        ))}
      </div>

      <button className="btn-primary" style={{ width: "100%" }}>
        Exportovať report
      </button>
    </div>
  );
}
