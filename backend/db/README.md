# Database

Postgres stores users, image analysis metadata, and pothole detections.

Run `schema.sql` to create the tables. The FastAPI app can do this automatically on startup when `DB_AUTO_INIT=true`.

Images are stored in Blob Storage or local development storage. Postgres stores only the object key.

`analyses.is_saved` distinguishes draft analyses created during `/detect` from finalized analyses saved through `/detections`.

