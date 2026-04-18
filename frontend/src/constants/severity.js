export const SEVERITY_CONFIG = {
  high:   { label: "Vysoká",  color: "#E8432D", bg: "#FEF0ED", dot: "#E8432D" },
  medium: { label: "Stredná", color: "#E8923D", bg: "#FEF5ED", dot: "#E8923D" },
  low:    { label: "Nízka",   color: "#3DAE8C", bg: "#EDF7F3", dot: "#3DAE8C" },
};

// Formát zodpovedá tomu čo pošle backend po konverzii z YOLO formátu:
// YOLO:    class  x_center  y_center  width   height   (všetko 0.0–1.0)
// Backend: konvertuje x_center→x_topleft, y_center→y_topleft a pridá id, confidence, severity
// Frontend dostane:  { id, x, y, w, h, confidence, severity }
//                         ↑  ↑              (ľavý horný roh, nie stred)
export const MOCK_RESULTS = [
  { id: 1, x: 0.091, y: 0.317, w: 0.138, h: 0.054, confidence: 0.91, severity: "low"    },
  { id: 2, x: 0.181, y: 0.076, w: 0.304, h: 0.175, confidence: 0.84, severity: "high"   },
  { id: 3, x: 0.417, y: 0.025, w: 0.165, h: 0.043, confidence: 0.76, severity: "low"    },
  { id: 4, x: 0.000, y: 0.664, w: 0.858, h: 0.336, confidence: 0.88, severity: "high"   },
  { id: 5, x: 0.281, y: 0.306, w: 0.372, h: 0.148, confidence: 0.62, severity: "medium" },
];

export const MOCK_HISTORY = [
  { id: 101, date: "2025-04-10", location: "Hlavná ul., Bratislava", count: 3, severity: "high" },
  { id: 102, date: "2025-04-09", location: "Obchodná ul., Košice",   count: 1, severity: "medium" },
  { id: 103, date: "2025-04-08", location: "Mierová ul., Žilina",    count: 5, severity: "high" },
];

export const STATS = [
  { label: "Spracovaných snímok", value: "1 284" },
  { label: "Detekovaných dier",   value: "3 907" },
  { label: "Priem. spoľahlivosť", value: "84 %" },
  { label: "Hlásení dnes",        value: "37" },
];
