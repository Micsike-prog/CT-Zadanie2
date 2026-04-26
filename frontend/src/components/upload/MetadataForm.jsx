export function MetadataForm({ values, onChange }) {
  const field = (label, key, input) => (
    <div>
      <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>{label}</label>
      {input}
    </div>
  );

  const inputStyle = {
    width: "100%", padding: "10px 14px",
    border: "1.5px solid #E0DFD8", borderRadius: 9,
    fontSize: 14, fontFamily: "inherit", color: "#111",
    outline: "none", background: "#FAFAF8",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {field("GPS poloha", "location",
        <input
          value={values.location}
          onChange={(e) => onChange("location", e.target.value)}
          placeholder="napr. 48.1516, 17.1075"
          style={inputStyle}
        />
      )}
      {field("Dátum záznamu", "date",
        <input
          type="date"
          value={values.date}
          onChange={(e) => onChange("date", e.target.value)}
          style={inputStyle}
        />
      )}
      {field("Vozovka", "roadType",
        <select
          value={values.roadType}
          onChange={(e) => onChange("roadType", e.target.value)}
          style={{ ...inputStyle, appearance: "auto" }}
        >
          <option value="mestska">Mestská komunikácia</option>
          <option value="prva">Cesta I. triedy</option>
          <option value="druha">Cesta II. triedy</option>
          <option value="dialnica">Diaľnica</option>
        </select>
      )}
    </div>
  );
}
