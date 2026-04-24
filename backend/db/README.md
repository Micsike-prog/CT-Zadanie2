# Database

Postgres stores users, image analysis metadata, and pothole detections.

Run `schema.sql` on the Render database to create the tables.

Images are stored in S3. Postgres stores only the S3 object key.

