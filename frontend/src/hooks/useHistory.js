import { useState, useEffect } from "react";
import { fetchHistory } from "../services/api";
import { MOCK_HISTORY } from "../constants/severity";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export function useHistory(filters = {}, token) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = USE_MOCK ? MOCK_HISTORY : await fetchHistory(filters, token);
        if (!cancelled) setHistory(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [JSON.stringify(filters), token]);

  return { history, loading, error };
}
