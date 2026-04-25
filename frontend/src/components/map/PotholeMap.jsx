import { useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { SEVERITY_CONFIG } from "../../constants/severity";
import { SeverityBadge } from "../ui/SeverityBadge";
import { useHistory } from "../../hooks/useHistory";
import "leaflet/dist/leaflet.css";

// Veľkosť kruhu podľa počtu dier
function markerRadius(count) {
  if (count >= 5) return 16;
  if (count >= 3) return 12;
  return 8;
}

// Komponent ktorý nastaví pohľad mapy – použijeme pri filtrovaní
function FitBounds({ markers }) {
  const map = useMap();
  if (markers.length > 0) {
    const bounds = markers.map(m => [m.lat, m.lng]);
    map.fitBounds(bounds, { padding: [40, 40] });
  }
  return null;
}

export function PotholeMap({ token }) {
  const [filters, setFilters] = useState({ high: true, medium: true, low: true });
  const [days, setDays] = useState("7");
  const [selectedId, setSelectedId] = useState(null);
  const { history, loading, error } = useHistory({ days }, token);

  const toggleFilter = (key) => setFilters(f => ({ ...f, [key]: !f[key] }));

  const markers = history
    .filter((row) => row.lat != null && row.lng != null && row.severity)
    .map((row) => ({ ...row, id: row.analysisId || row.id }));
  const visibleMarkers = markers.filter(m => filters[m.severity]);

  const counts = {
    high:   visibleMarkers.filter(m => m.severity === "high").length,
    medium: visibleMarkers.filter(m => m.severity === "medium").length,
    low:    visibleMarkers.filter(m => m.severity === "low").length,
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: "#111", letterSpacing: "-.03em", marginBottom: 4 }}>Mapa dier</h1>
        <p style={{ fontSize: 14, color: "#888" }}>Geografická vizualizácia detekovaných dier · OpenStreetMap</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }}>

        {/* Mapa */}
        <div style={{ border: "1px solid #E8E7E2", borderRadius: 16, overflow: "hidden", height: 540 }}>
          <MapContainer
            center={[48.7, 19.5]}
            zoom={7}
            style={{ width: "100%", height: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {visibleMarkers.map((m) => {
              const cfg = SEVERITY_CONFIG[m.severity];
              const isSelected = selectedId === m.id;
              return (
                <CircleMarker
                  key={m.id}
                  center={[m.lat, m.lng]}
                  radius={markerRadius(m.count)}
                  pathOptions={{
                    color: cfg.color,
                    fillColor: cfg.color,
                    fillOpacity: isSelected ? 1 : 0.75,
                    weight: isSelected ? 3 : 2,
                  }}
                  eventHandlers={{ click: () => setSelectedId(m.id) }}
                >
                  <Popup>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", minWidth: 180 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: "#111" }}>
                        {m.location}
                      </div>
                      <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>{m.date}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <SeverityBadge severity={m.severity} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#111", fontFamily: "monospace" }}>
                          {m.count} {m.count === 1 ? "diera" : m.count < 5 ? "diery" : "dier"}
                        </span>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
            <FitBounds markers={visibleMarkers} />
          </MapContainer>
          {loading && <div style={{ padding: 10, fontSize: 12, color: "#888", background: "#fff" }}>Načítavam záznamy...</div>}
          {error && <div style={{ padding: 10, fontSize: 12, color: "#E8432D", background: "#fff" }}>{error}</div>}
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Filter závažnosti */}
          <div style={{ background: "#fff", border: "1px solid #E8E7E2", borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 14, textTransform: "uppercase", letterSpacing: ".06em" }}>
              Filter
            </div>
            {["high", "medium", "low"].map((s) => (
              <label key={s} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={filters[s]}
                  onChange={() => toggleFilter(s)}
                  style={{ accentColor: SEVERITY_CONFIG[s].color, width: 16, height: 16 }}
                />
                <SeverityBadge severity={s} />
              </label>
            ))}

            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>Časové obdobie</label>
              <select
                value={days}
                onChange={(e) => setDays(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E0DFD8", borderRadius: 9, fontSize: 13, fontFamily: "inherit", background: "#FAFAF8" }}
              >
                <option value="7">Posledných 7 dní</option>
                <option value="30">Posledných 30 dní</option>
                <option value="365">Tento rok</option>
              </select>
            </div>
          </div>

          {/* Legenda */}
          <div style={{ background: "#fff", border: "1px solid #E8E7E2", borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 14, textTransform: "uppercase", letterSpacing: ".06em" }}>
              Legenda
            </div>
            {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: 6,
                    background: cfg.color,
                    border: "2px solid #fff",
                    boxShadow: `0 0 0 1.5px ${cfg.color}`,
                  }} />
                  <span style={{ fontSize: 13, color: "#555" }}>{cfg.label} závažnosť</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#111", fontFamily: "'DM Mono', monospace" }}>
                  {counts[key]}
                </span>
              </div>
            ))}

            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #F0EFE9" }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Veľkosť kruhu = počet dier</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {[1, 3, 5].map((count) => (
                  <div key={count} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{
                      width: markerRadius(count) * 2,
                      height: markerRadius(count) * 2,
                      borderRadius: "50%",
                      background: "#888",
                      opacity: 0.6,
                    }} />
                    <span style={{ fontSize: 11, color: "#999" }}>{count}+</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button style={{
            background: "#111", color: "#fff", border: "none", borderRadius: 10,
            padding: "14px 24px", fontSize: 15, fontWeight: 600,
            fontFamily: "inherit", cursor: "pointer", width: "100%",
          }}>
            Exportovať report
          </button>
        </div>
      </div>
    </div>
  );
}
