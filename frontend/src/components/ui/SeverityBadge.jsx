import { SEVERITY_CONFIG } from "../../constants/severity";

export function SeverityBadge({ severity }) {
  const cfg = SEVERITY_CONFIG[severity];
  if (!cfg) return null;

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: 20,
      background: cfg.bg, color: cfg.color,
      fontSize: 12, fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}
