# Proposal

## Why

Repository baru berisi dokumen, sehingga belum ada aplikasi yang bisa dijalankan atau dinilai. US-001 (FR-1, NFR-1) menyediakan fondasi yang berjalan dengan satu perintah, agar semua fitur berikutnya dibangun di atas stack yang sudah terbukti bekerja.

## What Changes

- Menambah backend Go yang berjalan sebagai server HTTP, dengan konfigurasi dari environment dan graceful shutdown.
- Menambah `GET /api/v1/health` serta envelope standar untuk respons sukses, 404, 405, dan 500.
- Menambah migrasi awal tabel `entities` yang terpasang otomatis saat backend start.
- Menambah frontend React + TypeScript berupa halaman awal yang menampilkan status koneksi ke backend. Peta belum termasuk.
- Menambah Docker Compose untuk database, backend, dan frontend.
- Menambah konfigurasi lint dan test yang menegakkan aturan `CLAUDE.md`, serta satu test E2E untuk membuktikan seluruh stack.
- Menambah seed lokal dan database test.

**Tidak termasuk:**

- Endpoint CRUD entitas dan query `entities` (US-002 sampai US-006).
- Peta, marker, form, dan design system lengkap (US-002 dan seterusnya).
- Validasi entitas (US-004, US-005, dan US-007).
- Koleksi Postman (US-007).
- Deployment di luar mesin lokal.

## Capabilities

### New Capabilities

- `application-runtime`: Cara aplikasi dijalankan, memasang skema database, menyimpan data secara persisten, dan melaporkan kesehatannya.

### Modified Capabilities

Tidak ada. Belum ada spec di `openspec/specs/`.

## Impact

- **Kode baru:** `backend/`, `frontend/`, `db/init/`, dan `docker-compose.yml`.
- **API:** `GET /api/v1/health`, sesuai `docs/openapi.yaml`, tanpa perubahan kontrak.
- **Database:** tabel `entities` dibuat lewat migrasi `00001`, sesuai `docs/DATABASE.md`. Database `geoentity_test` dibuat untuk test lokal.
- **Dependensi:** sesuai `docs/ITA.md`. Tambahan di luar ITA dicatat di ITA pada change ini.
- **CI:** job `backend`, `frontend`, dan `e2e` di `.github/workflows/ci.yml` aktif dengan sendirinya setelah kodenya ada. Dependabot ditambah ekosistem `gomod` dan `npm`.
- **Dokumen:** `README.md`, `CHANGELOG.md`, `docs/GUIDE.md`, `docs/AI_USAGE.md`, dan status US-001.
- **Prasyarat:** Docker harus berjalan untuk membuktikan kriteria penerimaan, dan branch harus di-push untuk membuktikan CI.
