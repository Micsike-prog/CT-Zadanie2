import { useState } from "react";
import { useHistory } from "../../hooks/useHistory";
import { SeverityBadge } from "../ui/SeverityBadge";

export function HistoryTable() {
  const [search, setSearch] = useState("");
  const { history, loading, error } = useHistory();

  const filtered = history.filter((row) =>
    row.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: "#111", letterSpacing: "-.03em", marginBottom: 4 }}>História analýz</h1>
          <p style={{ fontSize: 14, color: "#888" }}>Posledné záznamy z databázy</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Hľadať podľa lokality…"
          style={{ padding: "10px 16px", border: "1.5px solid #E0DFD8", borderRadius: 10, fontSize: 14, fontFamily: "inherit", width: 240, outline: "none" }}
        />
      </div>

      <div style={{ background: "#fff", border: "1px solid #E8E7E2", borderRadius: 16, overflow: "hidden" }}>
        {loading && (
          <div style={{ padding: 40, textAlign: "center", color: "#888", fontSize: 14 }}>Načítavam…</div>
        )}
        {error && (
          <div style={{ padding: 40, textAlign: "center", color: "#E8432D", fontSize: 14 }}>{error}</div>
        )}
        {!loading && !error && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F7F6F2" }}>
                {["ID", "Dátum", "Lokalita", "Diery", "Závažnosť", "Akcia"].map((h) => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: ".06em", borderBottom: "1px solid #E8E7E2" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={row.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F0EFE9" : "none" }}>
                  <td style={{ padding: "16px 20px", fontSize: 13, color: "#888", fontFamily: "'DM Mono', monospace" }}>#{row.id}</td>
                  <td style={{ padding: "16px 20px", fontSize: 13, color: "#555" }}>{row.date}</td>
                  <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 500, color: "#111" }}>{row.location}</td>
                  <td style={{ padding: "16px 20px" }}>
                    <span style={{ background: "#F0EFE9", color: "#333", borderRadius: 8, padding: "3px 10px", fontSize: 13, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>
                      {row.count}
                    </span>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <SeverityBadge severity={row.severity} />
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <button style={{ background: "#fff", color: "#111", border: "1.5px solid #E0DFD8", borderRadius: 10, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
