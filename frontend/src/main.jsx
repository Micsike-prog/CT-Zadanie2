import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import L from "leaflet";
import App from "./App";
import "./index.css";

// Fix pre Leaflet + Vite – bez tohto sa nezobrazujú ikony markerov
// (my používame CircleMarker takže ikony nepotrebujeme, ale CSS import
//  stále vyžaduje aby tieto URL existovali)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
