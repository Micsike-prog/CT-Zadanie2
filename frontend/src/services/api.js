const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Pošle obrázok na backend a vráti bounding boxy z YOLOv8.
 * @param {File} imageFile
 * @param {{ location: string, date: string, roadType: string }} metadata
 * @returns {Promise<Array>} detekované diery
 */
export async function detectPotholes(imageFile, metadata) {
  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("location", metadata.location);
  formData.append("date", metadata.date);
  formData.append("road_type", metadata.roadType);

  const response = await fetch(`${BASE_URL}/detect`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Chyba servera: ${response.status}`);
  }

  return response.json(); // [{ id, x, y, w, h, confidence, severity }]
}

/**
 * Načíta históriu analýz z databázy.
 * @param {{ severity?: string, days?: number }} filters
 * @returns {Promise<Array>}
 */
export async function fetchHistory(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  const response = await fetch(`${BASE_URL}/history?${params}`);

  if (!response.ok) {
    throw new Error(`Chyba servera: ${response.status}`);
  }

  return response.json();
}

/**
 * Uloží výsledky detekcie do databázy.
 * @param {{ imageId: string, results: Array, metadata: object }} payload
 */
export async function saveDetection(payload) {
  const response = await fetch(`${BASE_URL}/detections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Chyba pri ukladaní: ${response.status}`);
  }

  return response.json();
}
