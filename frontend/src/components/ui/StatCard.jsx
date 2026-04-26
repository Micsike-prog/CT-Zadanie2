export function StatCard({ label, value }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #E8E7E2", borderRadius: 16,
      padding: "20px 24px",
    }}>
      <div style={{ fontSize: 12, color: "#999", fontWeight: 500, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".06em" }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, color: "#111", letterSpacing: "-.03em", fontFamily: "'DM Mono', monospace" }}>
        {value}
      </div>
    </div>
  );
}
