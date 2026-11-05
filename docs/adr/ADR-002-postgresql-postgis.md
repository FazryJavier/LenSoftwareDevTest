# ADR-002: PostgreSQL dan PostGIS untuk penyimpanan

**Status:** Diterima

## Konteks

Setiap entitas memiliki koordinat, dan peta hanya perlu memuat entitas pada area yang sedang terlihat.

## Keputusan

Memakai PostgreSQL 17 dengan PostGIS 3.7. Koordinat disimpan dalam satu kolom `geography(Point, 4326)` dengan indeks GiST. Atribut yang berbeda per jenis entitas disimpan pada kolom `jsonb`.

## Konsekuensi

- Query `bbox` memakai indeks spasial pada `location::geometry` dan tidak perlu menghitung koordinat secara manual. Tipe `geography` dipertahankan untuk integritas koordinat. Indeksnya memakai geometry karena area peta adalah persegi bujur-lintang.
- Koordinat tidak memiliki dua sumber kebenaran.
- Reviewer membutuhkan Docker, karena PostGIS lebih sulit dipasang langsung di mesin.
- Lapisan `store` harus menangani urutan `longitude, latitude` dengan benar.

## Alternatif

- **PostgreSQL dengan kolom `latitude` dan `longitude` biasa:** lebih sederhana, tetapi query area memerlukan indeks gabungan dan tidak dapat berkembang ke query jarak dengan mudah.
- **SQLite:** mudah dijalankan, tetapi fungsi spasial memerlukan ekstensi SpatiaLite.
