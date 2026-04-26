# Databáza

PostgreSQL ukladá používateľov, metadáta analýz obrázkov a detekcie dier.

Na vytvorenie tabuliek spustite `schema.sql`. FastAPI aplikácia to vie urobiť automaticky pri štarte, ak je `RUN_MIGRATIONS_ON_STARTUP=true`.

Obrázky sa ukladajú do objektového úložiska alebo lokálneho vývojového úložiska. PostgreSQL uchováva iba objektový kľúč.

Aktuálna implementácia ukladá výsledky analýzy priamo počas volania `/detect`.
