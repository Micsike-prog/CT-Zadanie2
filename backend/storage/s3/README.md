# S3

S3 ukladá nahrané obrázky vozovky.

Používajte tento formát objektového kľúča:

```text
uploads/originals/YYYY/MM/{analysis_id}.{ext}
```

Bucket nechajte súkromný. Backend má obrázky nahrávať a vytvárať krátkodobé
`presigned URL`, keď ich frontend potrebuje zobraziť.

Potrebné backend premenné prostredia:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `S3_BUCKET`

Backend tieto hodnoty kontroluje pri štarte a odmietne sa spustiť, ak chýbajú
alebo v nich ostali len zástupné hodnoty.
