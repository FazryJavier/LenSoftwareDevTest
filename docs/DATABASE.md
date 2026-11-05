# Database

Database yang dipakai adalah PostgreSQL 17 dengan PostGIS 3.7. Diagram ada di [ERD](ERD.md), dan alasan pemilihannya di [ADR-002](adr/ADR-002-postgresql-postgis.md).

## 1. Relasi

**Saat ini tidak ada relasi antartabel.** Semua kebutuhan dalam [PRD](PRD.md) dipenuhi oleh satu tabel `entities`.

| Data | Bentuk | Alasan |
|---|---|---|
| Jenis dan status | Kolom teks dengan `CHECK` | Nilainya tetap dan tidak memiliki atribut sendiri, sehingga belum memerlukan tabel referensi |
| Atribut tambahan | Kolom `jsonb` | Tiap jenis entitas punya atribut berbeda, dan atribut tidak dipakai untuk relasi |

Bila kelak diperlukan riwayat posisi, tabel `entity_locations` dapat ditambahkan dengan relasi `entities 1—N entity_locations`. Tabel itu tidak dibuat sekarang karena belum dibutuhkan.

## 2. Tabel `entities`

| Kolom | Tipe | Null | Default | Keterangan |
|---|---|---|---|---|
| `id` | `uuid` | Tidak | `gen_random_uuid()` | Primary key |
| `name` | `varchar(100)` | Tidak | — | Tidak boleh kosong setelah di-trim; tidak harus unik |
| `type` | `text` | Tidak | — | `vehicle`, `iot_device`, `facility`, `other` |
| `status` | `text` | Tidak | — | `active`, `inactive`, `maintenance` |
| `description` | `varchar(500)` | Ya | — | Keterangan bebas |
| `attributes` | `jsonb` | Tidak | `'{}'` | Harus berupa objek JSON |
| `location` | `geography(Point, 4326)` | Tidak | — | Sumber tunggal koordinat |
| `created_at` | `timestamptz` | Tidak | `now()` | Waktu dibuat |
| `updated_at` | `timestamptz` | Tidak | `now()` | Diperbarui oleh query `UPDATE` |

**Urutan koordinat:** PostGIS menerima `ST_MakePoint(longitude, latitude)`. API memakai field bernama `latitude` dan `longitude`, sehingga urutan ini hanya berlaku di lapisan `store`. Keduanya mudah tertukar dan wajib dicakup test integrasi.

## 3. Migrasi awal

File: `backend/migrations/00001_create_entities.sql`. Migrasi ini sudah diuji pada PostgreSQL 18 dengan PostGIS 3.6. Versi Compose, yaitu PostgreSQL 17 dengan PostGIS 3.7, diuji oleh CI.

```sql
-- +goose Up
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE entities (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        varchar(100) NOT NULL CHECK (char_length(btrim(name)) > 0),
    type        text NOT NULL CHECK (type IN ('vehicle', 'iot_device', 'facility', 'other')),
    status      text NOT NULL CHECK (status IN ('active', 'inactive', 'maintenance')),
    description varchar(500),
    attributes  jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(attributes) = 'object'),
    location    geography(Point, 4326) NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX entities_location_gist_idx ON entities USING gist (location);
CREATE INDEX entities_type_status_idx ON entities (type, status);
CREATE INDEX entities_created_at_id_idx ON entities (created_at DESC, id DESC);

-- +goose Down
DROP TABLE entities;
```

`Down` hanya boleh dijalankan secara sadar pada database lokal karena menghapus data. Ekstensi `postgis` sengaja tidak dihapus karena mungkin dipakai objek lain.

Migrasi `00002_use_geometry_location_index.sql` mengganti `entities_location_gist_idx` dengan indeks ekspresi `entities_location_geometry_gist_idx` pada `(location::geometry)`. Area peta adalah persegi bujur-lintang, sedangkan indeks `geography` membandingkan kotak 3D geosentris, sehingga tidak cocok untuk query ini.

## 4. Pola query

```sql
-- Membaca koordinat
SELECT id, name, type, status, description, attributes,
       ST_Y(location::geometry) AS latitude,
       ST_X(location::geometry) AS longitude,
       created_at, updated_at
FROM entities
WHERE id = $1;

-- Filter area peta, jenis, dan status. Kondisi hanya disertakan bila filternya ada.
WHERE ST_Intersects(location::geometry, ST_MakeEnvelope($1, $2, $3, $4, 4326))
  AND type = ANY($5)
  AND status = ANY($6)
ORDER BY created_at DESC, id DESC
LIMIT $7 OFFSET $8;

-- Menyimpan koordinat
INSERT INTO entities (name, type, status, description, attributes, location)
VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography);
```

Pada contoh `INSERT`, `$6` adalah longitude dan `$7` adalah latitude. Pada `ST_MakeEnvelope`, urutannya `minLng, minLat, maxLng, maxLat`.

## 5. Data contoh

`backend/seed/seed.sql` berisi 6 entitas di sekitar Bandung dan Jakarta. Seed dijalankan manual dan tidak pernah berjalan otomatis. File ini memakai UUID tetap dan `ON CONFLICT DO NOTHING`, sehingga aman dijalankan berulang. Perintahnya ada di [GUIDE](GUIDE.md).

## 6. Aturan keamanan operasi

- Perubahan skema selalu melalui migrasi baru. File migrasi yang sudah di-commit tidak diubah.
- `docker compose down -v`, `DROP`, `TRUNCATE`, dan `DELETE` massal memerlukan konfirmasi pemilik proyek.
- `DATABASE_URL` selain lokal tidak boleh dipakai untuk pengembangan atau test.
