const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const TOKEN_KEY = "potholeai_token";
const USER_KEY = "potholeai_user";

export function getStoredAuth() {
  const token = localStorage.getItem(TOKEN_KEY);
  const userRaw = localStorage.getItem(USER_KEY);
  try {
    return {
      token,
      user: userRaw ? JSON.parse(userRaw) : null,
    };
  } catch {
    clearStoredAuth();
    return { token: null, user: null };
  }
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function loginUser(email, password) {
  const response = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(response.status === 401 ? "Nesprávny email alebo heslo." : `Chyba servera: ${response.status}`);
  }

  const data = await response.json();
  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data;
}

function authHeaders(token) {
  if (!token) throw new Error("Chýba prihlasovací token.");
  return { Authorization: `Bearer ${token}` };
}

/**
 * Pošle obrázok na backend a vráti bounding boxy z YOLOv8.
 * @param {File} imageFile
 * @param {{ location: string, date: string, roadType: string }} metadata
 * @returns {Promise<Array>} detekované diery
 */
export async function detectPotholes(imageFile, metadata, token) {
  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("location", metadata.location);
  formData.append("date", metadata.date);
  formData.append("road_type", metadata.roadType);

  const response = await fetch(`${BASE_URL}/detect`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Chyba servera: ${response.status}`);
  }

  return response.json();
}

/**
 * Načíta históriu analýz z databázy.
 * @param {{ severity?: string, days?: number }} filters
 * @returns {Promise<Array>}
 */
export async function fetchHistory(filters = {}, token) {
  const params = new URLSearchParams(filters).toString();
  const url = params ? `${BASE_URL}/history?${params}` : `${BASE_URL}/history`;
  const response = await fetch(url, { headers: authHeaders(token) });

  if (!response.ok) {
    throw new Error(`Chyba servera: ${response.status}`);
  }

  return response.json();
}
