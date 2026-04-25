# S3

S3 stores uploaded road images.

Use this object key format:

```text
uploads/originals/YYYY/MM/{analysis_id}.{ext}
```

Keep the bucket private. The backend should upload images and create short-lived
presigned URLs when the frontend needs to display them.

Required backend env vars for `STORAGE_PROVIDER=aws`:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_S3_BUCKET`

The backend validates these values on startup and refuses to boot if they are
missing or still set to placeholder values.

