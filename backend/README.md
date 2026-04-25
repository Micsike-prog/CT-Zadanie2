# Backend

FastAPI backend pre `PotholeAI` funguje ako orchestrátor medzi frontendom, AWS S3, AWS Lambdou a PostgreSQL. Cieľový deploy je Azure App Service.

## Čo backend robí

- `POST /detect`
  Prijme obrázok, uloží originál do AWS S3, vytvorí draft analýzu a spustí detekciu cez AWS Lambdu.
- `POST /detections`
  Finalizuje draft analýzu, uloží bounding boxy do PostgreSQL a dopočíta agregované štatistiky.
- `GET /history`
  Vráti uložené analýzy s filtrom podľa závažnosti a počtu dní.
- `GET /health`
  Jednoduchý healthcheck endpoint.

## Lokálne spustenie

```powershell
copy backend\.env.example backend\.env
py -3 -m venv .venv
.venv\Scripts\activate
pip install -r backend\requirements.txt
uvicorn backend.app.main:app --reload
```

Backend očakáva PostgreSQL databázu. Ak je `DB_AUTO_INIT=true`, pri štarte aplikuje pending SQL migrácie z `backend/db/migrations/`.
Pre lokálny vývoj je to pohodlné. Pre App Service produkciu odporúčam `DB_AUTO_INIT=false` a migrácie púšťať explicitne skriptom pred štartom novej verzie.
Backend failne hneď pri štarte, ak pri AWS konfigurácii ostali placeholder credentials alebo ak pri `INFERENCE_PROVIDER=lambda` chýba `AWS_LAMBDA_FUNCTION_NAME`.

Pri `STORAGE_PROVIDER=aws` backend validuje storage konfiguráciu hneď na štarte. Ak ostanú v `.env` placeholder hodnoty ako `your-aws-secret-access-key`, aplikácia failne hneď pri boot-e.

## AWS Auth

Autentifikácia voči AWS službám je riešená len na backende cez:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- voliteľne `AWS_SESSION_TOKEN`

Frontend tieto credentials nikdy nevidí. Všetky operácie so `S3` a `Lambda` prechádzajú cez backend.

## Cieľová architektúra

- Frontend: Vercel
- Backend API: Azure App Service alebo Render Web Service
- Databáza: PostgreSQL
- Image storage: AWS S3
- ML inference: AWS Lambda
- Model: YOLOv8 ako ONNX v Lambda image

Tok requestu:

1. Frontend pošle obrázok na backend.
2. Backend uloží obrázok do S3.
3. Backend zavolá AWS Lambdu s `s3_bucket + s3_key`.
4. Lambda načíta obrázok zo S3 a spraví detekciu.
5. Lambda vráti bounding boxy backendu.
6. Backend vráti preview FE a po potvrdení uloží výsledok do PostgreSQL.

## Guardy a limity

Backend má základné ochranné guardy:

- rate limiting pre `POST /detect`
- rate limiting pre `POST /detections`
- rate limiting pre `GET /history`
- limit veľkosti uploadu cez `MAX_UPLOAD_BYTES`

Aktuálna implementácia používa in-memory limiter, čo je vhodné na lokál a základný single-instance deploy. Pri multi-instance nasadení by sa neskôr oplatilo prejsť na Redis-based limiter.

## Inference Provider

- `lambda`
  Produkčný flow cez AWS Lambda.
- `local`
  Developer fallback cez lokálny ONNX model.
- `mock`
  Developer fallback s mock bounding boxami.

## Konkrétny lokálny test

Predpoklady:

- beží PostgreSQL
- existuje AWS S3 bucket
- ak používaš `INFERENCE_PROVIDER=lambda`, existuje aj AWS Lambda function
- ak používaš `INFERENCE_PROVIDER=local`, existuje `ml/runs/detect/baseline/weights/best.onnx`

1. Skopíruj env:

```powershell
copy backend\.env.example backend\.env
```

2. Uprav minimálne:

```env
DATABASE_URL=postgresql://pothole:pothole@localhost:5432/pothole_db
DB_AUTO_INIT=true
STORAGE_PROVIDER=aws
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-central-1
AWS_S3_BUCKET=...
AWS_LAMBDA_FUNCTION_NAME=...
INFERENCE_PROVIDER=lambda
```

3. Nainštaluj backend dependencies a spusti appku:

```powershell
py -3 -m venv .venv
.venv\Scripts\activate
pip install -r backend\requirements.txt
uvicorn backend.app.main:app --reload
```

4. Detekcia:

```powershell
$detectRaw = curl.exe -X POST "http://localhost:8000/detect" `
  -F "location=48.1516, 17.1075" `
  -F "date=2026-04-25" `
  -F "road_type=mestska" `
  -F "image=@C:\path\to\test.jpg"

$detectResponse = $detectRaw | ConvertFrom-Json
```

5. Finalizácia uloženia:

```powershell
$saveBody = @{
  analysis_id = $detectResponse.analysis_id
  results = $detectResponse.detections
  metadata = @{
    location = "48.1516, 17.1075"
    date = "2026-04-25"
    roadType = "mestska"
  }
} | ConvertTo-Json -Depth 6

Invoke-RestMethod -Method Post `
  -Uri "http://localhost:8000/detections" `
  -ContentType "application/json" `
  -Body $saveBody
```

6. História:

```powershell
Invoke-RestMethod -Method Get `
  -Uri "http://localhost:8000/history"
```

## Azure návrh

- FastAPI deploy ako Azure App Service alebo Azure Web App for Containers.
- PostgreSQL ako Azure Database for PostgreSQL Flexible Server alebo Render Postgres.
- Obrázky v AWS S3.
- Inferencia cez AWS Lambda.

## Azure App Service

Pre tento backend odporúčam deploy cez custom container z `backend/Dockerfile`.

Dôležité App Service settings:

- `WEBSITES_PORT=8000`
- `APP_ENV=production`
- `DEBUG=false`
- `DB_AUTO_INIT=false`
- `DATABASE_URL=...`
- `STORAGE_PROVIDER=aws`
- `AWS_ACCESS_KEY_ID=...`
- `AWS_SECRET_ACCESS_KEY=...`
- `AWS_REGION=...`
- `AWS_S3_BUCKET=...`
- `AWS_LAMBDA_FUNCTION_NAME=...`
- `INFERENCE_PROVIDER=lambda`

Podľa Microsoft Learn pri Linux custom containeri treba pri inom porte než `80` nastaviť `WEBSITES_PORT`. Zdroj:
https://learn.microsoft.com/en-us/azure/app-service/configure-custom-container
