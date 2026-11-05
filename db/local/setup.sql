-- Menyiapkan PostgreSQL yang terpasang langsung di mesin, untuk pengembangan tanpa Docker.
-- Jalankan sekali sebagai superuser:
--   psql -h localhost -U postgres -v ON_ERROR_STOP=1 -f db/local/setup.sql
-- Password di bawah hanya nilai lokal yang sama dengan .env.example.

CREATE ROLE geo LOGIN PASSWORD 'geo_local_only';

CREATE DATABASE geoentity OWNER geo;
CREATE DATABASE geoentity_test OWNER geo;

-- Role geo bukan superuser, sehingga ekstensi dibuat di sini lebih dulu.
\connect geoentity
CREATE EXTENSION postgis;

\connect geoentity_test
CREATE EXTENSION postgis;
