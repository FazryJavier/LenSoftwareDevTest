# ADR-003: `net/http` dan pgx tanpa framework atau ORM

**Status:** Diterima

## Konteks

API memiliki enam endpoint dan memerlukan query PostGIS yang eksplisit.

## Keputusan

Memakai `net/http` untuk routing dan `jackc/pgx/v5` dengan SQL yang ditulis langsung.

## Konsekuensi

- Dependensi backend sedikit, sehingga permukaan kerentanan juga kecil.
- SQL mudah dibaca dan ditinjau.
- Middleware, envelope, dan pemetaan baris perlu ditulis sendiri, dengan jumlah kode yang tetap kecil pada skala ini.

## Alternatif

- **Gin atau chi:** nyaman, tetapi fiturnya belum dibutuhkan.
- **GORM:** mengurangi boilerplate CRUD, tetapi kolom `geography` tetap memerlukan SQL manual.
- **sqlc:** aman tipe, tetapi menambah langkah code generation untuk jumlah query yang sedikit.
