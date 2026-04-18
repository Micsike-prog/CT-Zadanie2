import { useState, useCallback } from "react";
import { detectPotholes } from "../services/api";
import { MOCK_RESULTS } from "../constants/severity";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export function useDetection() {
  const [image, setImage] = useState(null);
  const [imageURL, setImageURL] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImage(file);
    setImageURL(URL.createObjectURL(file));
    setResults(null);
    setError(null);
  }, []);

  const handleAnalyze = useCallback(async (metadata) => {
    if (!image) return;
    setAnalyzing(true);
    setError(null);

    try {
      if (USE_MOCK) {
        // Simulácia oneskorenia backendu počas vývoja
        await new Promise((r) => setTimeout(r, 2200));
        setResults(MOCK_RESULTS);
      } else {
        const data = await detectPotholes(image, metadata);
        setResults(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }, [image]);

  const reset = useCallback(() => {
    if (imageURL) URL.revokeObjectURL(imageURL);
    setImage(null);
    setImageURL(null);
    setResults(null);
    setError(null);
  }, [imageURL]);

  return { image, imageURL, analyzing, results, error, handleFile, handleAnalyze, reset };
}
