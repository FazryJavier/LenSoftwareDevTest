# ERD — Entity Relationship Diagram

Kebutuhan saat ini hanya memerlukan satu tabel bisnis, `entities`. Karena itu ERD tidak memiliki relasi antartabel. Alasan dan definisi kolomnya ada di [DATABASE](DATABASE.md).

```mermaid
erDiagram
    ENTITIES {
        uuid id PK "default gen_random_uuid()"
        varchar_100 name "NOT NULL"
        text type "NOT NULL, CHECK enum"
        text status "NOT NULL, CHECK enum"
        varchar_500 description "NULL"
        jsonb attributes "NOT NULL, default {}"
        geography_point location "NOT NULL, SRID 4326, indeks GiST pada geometry"
        timestamptz created_at "NOT NULL, default now()"
        timestamptz updated_at "NOT NULL, default now()"
    }
```

`goose_db_version` adalah tabel internal goose untuk mencatat migrasi, sehingga tidak ditampilkan sebagai bagian dari model bisnis.
