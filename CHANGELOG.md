# Changelog

Semua perubahan pada proyek ini dicatat di sini, dengan entri terbaru di atas, agar setiap fitur dapat ditelusuri: apa yang berubah, bagaimana caranya, dan bagaimana membuktikannya. Aturan pengisiannya ada di [CLAUDE.md](CLAUDE.md#changelog).

## 2026-11-06

### US-001: Fondasi aplikasi

- **Jenis:** Added
- **Apa:** Backend Go dengan `GET /api/v1/health`, frontend React yang menampilkan status koneksi backend, migrasi otomatis tabel `entities`, data contoh, dan Docker Compose. Peta dan CRUD entitas belum termasuk.
- **Bagaimana:** Backend memakai `net/http`, pgx, dan goose. Semua respons memakai envelope standar, termasuk 404 dan 405 dari router, serta panic yang menjadi 500 tanpa detail internal. Konfigurasi tidak valid menghentikan aplikasi saat start. Aturan kualitas ditegakkan oleh golangci-lint dan ESLint. Port database di host memakai 5433, dan tersedia jalur tanpa Docker lewat `db/local/setup.sql`.
- **File utama:** `backend/`, `frontend/`, `db/`, `docker-compose.yml`, `docs/GUIDE.md`
- **Jejak:** US-001, FR-1, NFR-1, OpenSpec `add-project-foundation`, branch `feat/us-001-project-foundation`
- **Pengujian:** 38 test Go tanpa database dan 16 test Vitest lulus. Test integrasi `internal/store`, migrasi, seed, restart backend, dan respons 503 dibuktikan pada PostgreSQL 18 dengan PostGIS 3.6. Playwright 2 test lulus melalui Vite dan backend lokal. golangci-lint, govulncheck, `npm audit`, ESLint, typecheck, dan build lulus. **Belum terbukti:** build Dockerfile, `docker compose up`, nginx, graceful shutdown, `go test -race`, dan semua job CI di GitHub.

### Changelog wajib untuk setiap perubahan

- **Jenis:** Added
- **Apa:** Setiap perubahan kini wajib memiliki entri di `CHANGELOG.md`.
- **Bagaimana:** Aturan ditambahkan ke `CLAUDE.md` dan dokumen proses. CI menambah job `changelog` yang menggagalkan Pull Request bila file ini tidak berubah.
- **File utama:** `CHANGELOG.md`, `CLAUDE.md`, `docs/WORKFLOW.md`, `.github/workflows/ci.yml`
- **Jejak:** Permintaan pemilik proyek; commit awal
- **Pengujian:** actionlint; logika cek diuji pada repository sementara. Belum dijalankan di GitHub.

## 2026-11-05

### Aturan pengembangan pada CLAUDE.md

- **Jenis:** Added
- **Apa:** Aturan proyek dan General Rules untuk Claude Code.
- **Bagaimana:** Menambahkan struktur backend dan frontend, environment, pengujian, serta aturan kualitas. Rujukan General Rules ke proyek dan alat lain diganti dengan konteks proyek ini. `RTK.md` disalin agar `@RTK.md` terbaca.
- **File utama:** `CLAUDE.md`, `RTK.md`, `.env.example`, `docs/ARCHITECTURE.md`, `docs/user_stories/US-001.md`
- **Jejak:** Permintaan pemilik proyek; commit awal
- **Pengujian:** Pemeriksaan link dan pencarian rujukan yang tersisa.

### CI dan autofix GitHub Actions

- **Jenis:** Added
- **Apa:** Pemeriksaan otomatis dan perbaikan format pada Pull Request.
- **Bagaimana:** Job backend, frontend, dan e2e aktif sendiri setelah kodenya ada. Action dikunci ke commit SHA. Autofix hanya berjalan untuk branch di repository ini.
- **File utama:** `.github/workflows/ci.yml`, `.github/workflows/autofix.yml`, `.github/dependabot.yml`, `.github/pull_request_template.md`
- **Jejak:** Permintaan pemilik proyek; commit awal
- **Pengujian:** actionlint. Belum dijalankan di GitHub.

### Fondasi dokumen dan OpenSpec

- **Jenis:** Added
- **Apa:** Dokumen requirement dan teknis, 8 user story, kontrak OpenAPI, serta OpenSpec untuk Claude Code.
- **Bagaimana:** Kebutuhan diturunkan dari soal tes. Pilihan stack dicek terhadap versi dan peer dependency di registry. OpenSpec dipasang dengan `openspec init --tools claude`.
- **File utama:** `docs/`, `openspec/`, `.claude/`, `README.md`
- **Jejak:** Soal tes; commit awal
- **Pengujian:** Lint OpenAPI, validasi OpenSpec tanpa change, render diagram Mermaid, pemeriksaan link, dan kontras warna. Kombinasi versi belum dibuktikan lewat build.
