# S3

S3 stores uploaded road images.

Use this object key format:

```text
uploads/originals/YYYY/MM/{analysis_id}.{ext}
```

Keep the bucket private. The backend should upload images and create short-lived
presigned URLs when the frontend needs to display them.

