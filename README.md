# CT-Zadanie2

# PotholeAI – Detekcia dier na cestách

Webová aplikácia na automatickú detekciu dier na cestách pomocou YOLOv8. Používateľ nahrá fotografiu cesty, model identifikuje diery a výsledky sa uložia do databázy s možnosťou zobrazenia na mape.

---

## Stav projektu

| Časť | Stav |
|---|---|
| Frontend (React + Vite) | 🔧 rozpracované (zataľ beží lokálne) |
| Mapa (react-leaflet + OpenStreetMap) | ✅ funkčná |
| Backend (FastAPI) | ⏳ plánované |
| Databáza (PostgreSQL) | ⏳ plánované |
| ML model (YOLOv8) | 🔧 tréning |
| Cloud nasadenie | ⏳ plánované |

---

## Štruktúra projektu

```
pothole-detection/
├── frontend/                    # React + Vite
│   ├── src/
│   │   ├── components/          # UI komponenty
│   │   ├── hooks/               # useDetection, useHistory
│   │   ├── services/api.js      # HTTP volania na backend
│   │   └── constants/severity.js
│   ├── .env.example
│   └── Dockerfile
├── backend/                     # (TODO)
├── ml/                          # tréning modelu (TODO)
│   └── backend_conversion_example.py  # konverzia YOLO -> frontend formát
├── docker-compose.yml           # DB + backend + frontend
└── README.md
```

---

## Spustenie – frontend (lokálne)

Backend zatiaľ nie je potrebný – frontend beží s mock dátami.

```bash
cd frontend

# Windows
copy .env.example .env

# Linux / Git Bash
cp .env.example .env

npm install
npm install react-leaflet@4 leaflet

npm run dev
```

Aplikácia beží na **http://localhost:3000**

### Prepnutie z mock dát na reálny backend

Keď bude backend hotový, je potrebné upraviť `frontend/.env`:

```env
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:8000
```

---

## Spustenie (Docker)

Všetky bloky sú v docker-compose.yml zatiaľ zakomentované.

| | |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Database | `pothole_db` |
| User | `pothole` |
| Password | `pothole` |

---

## Mapa

Mapa používa **react-leaflet** s **OpenStreetMap** – bez API kľúča, open-source.

```bash
# Inštalácia (react-leaflet@4 je kompatibilný s React 18)
npm install react-leaflet@4 leaflet
```

Funkcie mapy:
- Farebné kruhy podľa závažnosti diery
- Veľkosť kruhu zodpovedá počtu dier na danom mieste
- Kliknutím na kruh sa zobrazí popup s lokalitou, dátumom a závažnosťou
- Filter podľa závažnosti a časového obdobia

Po dokončení backendu stačí nahradiť `MOCK_MARKERS` v `PotholeMap.jsx` dátami z API – formát zostáva rovnaký (`lat`, `lng`, `severity`, `count`).

---

## Backend API

Endpointy ktoré musí backend implementovať:

| Metóda | Endpoint | Popis |
|---|---|---|
| `POST` | `/detect` | Prijme obrázok, spustí YOLOv8, vráti bounding boxy |
| `GET` | `/history` | Zoznam uložených analýz z DB |
| `POST` | `/detections` | Uloží výsledky detekcie do DB |

### Formát odpovede `POST /detect`

YOLOv8 vracia súradnice stredu boxu v pixeloch. Backend ich musí konvertovať na percentuálne súradnice ľavého horného rohu – postup je v `ml/backend_conversion_example.py`.

```json
[
  { "id": 1, "x": 0.091, "y": 0.317, "w": 0.138, "h": 0.054, "confidence": 0.91, "severity": "high" },
  { "id": 2, "x": 0.181, "y": 0.076, "w": 0.304, "h": 0.175, "confidence": 0.84, "severity": "medium" }
]
```

Kde `x, y` je ľavý horný roh boxu a `w, h` je šírka a výška – všetko ako percentá (0.0 – 1.0) voči veľkosti obrázka. `severity` sa vypočíta z plochy boxu (`w × h`): nad 5 % = `high`, 1.5–5 % = `medium`, pod 1.5 % = `low`.

---