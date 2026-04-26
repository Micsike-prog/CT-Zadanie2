import { useState } from "react";
import { loginUser } from "../../services/api";

export function LoginView({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    border: "1.5px solid #E0DFD8",
    borderRadius: 9,
    fontSize: 14,
    fontFamily: "inherit",
    color: "#111",
    outline: "none",
    background: "#FAFAF8",
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await loginUser(email, password);
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 420, margin: "0 auto", padding: "72px 24px" }}>
      <div className="fade-up" style={{ background: "#fff", border: "1px solid #E8E7E2", borderRadius: 16, padding: 28 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: "#111", letterSpacing: "-.03em", marginBottom: 6 }}>Prihlásenie</h1>
          <p style={{ fontSize: 14, color: "#777", lineHeight: 1.6 }}>Zadajte prihlasovacie údaje pre prístup k detekcii a histórii.</p>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>Heslo</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              style={inputStyle}
            />
          </div>

          {error && <div style={{ color: "#E8432D", fontSize: 13 }}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: "#111",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "13px 20px",
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.65 : 1,
            }}
          >
            {loading ? "Prihlasujem..." : "Prihlásiť sa"}
          </button>
        </form>
      </div>
    </main>
  );
}
