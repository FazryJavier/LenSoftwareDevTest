# Tasks

## 1. Backend inti

- [x] 1.1 Inisialisasi modul `github.com/FazryJavier/LenSoftwareDevTest/backend`, pasang `pgx/v5` dan `goose/v3`, serta catat versinya di `docs/ITA.md`; verifikasi dengan `go build ./...`
- [x] 1.2 Buat `internal/config` dengan test untuk nilai valid, variabel wajib kosong, banyak variabel salah sekaligus, nilai rahasia tidak tercetak, dan `CORS_ALLOWED_ORIGINS` berisi `*`; verifikasi dengan `go test ./internal/config`
- [x] 1.3 Buat `internal/httpapi/envelope.go` dengan test bahwa `code` sama dengan status HTTP dan `errors`, `data`, serta `meta` sesuai kontrak; verifikasi dengan `go test ./internal/httpapi`
- [x] 1.4 Buat middleware recover, request ID, log, security headers, dan CORS, dengan test untuk panic tanpa stack trace, `X-Request-ID`, origin diizinkan, dan origin ditolak; verifikasi dengan `go test ./internal/httpapi`
- [x] 1.5 Buat router dengan penulisan ulang 404 dan 405, dengan test 404 mux, 405 mux beserta `Allow`, dan 404 dari handler yang tidak ditulis ulang; verifikasi dengan `go test ./internal/httpapi`
- [x] 1.6 Buat `health_handler.go` dengan test 200 dan 503, termasuk bahwa detail error tidak bocor; verifikasi dengan `go test ./internal/httpapi`
- [x] 1.7 Buat `.golangci.yml` sesuai US-001; verifikasi dengan `go run github.com/golangci/golangci-lint/v2/cmd/golangci-lint@v2.15.0 run`

## 2. Database

- [x] 2.1 Buat `migrations/00001_create_entities.sql` dan `embed.go` sesuai `docs/DATABASE.md`; verifikasi dengan `go build ./...`
- [x] 2.2 Buat `internal/store/db.go` serta runner migrasi, dengan test integrasi untuk tabel, indeks spasial, migrasi yang dijalankan dua kali, dan penolakan database tanpa akhiran `_test`; verifikasi dengan `go test ./internal/store` terhadap PostGIS
- [x] 2.3 Buat `cmd/server/main.go` dengan migrasi saat start, timeout server, dan graceful shutdown; verifikasi dengan menjalankan binary terhadap PostGIS, lalu `curl` ke `/api/v1/health`
- [x] 2.4 Buat `backend/seed/seed.sql` dengan UUID tetap dan `db/init/01-create-test-db.sql`; verifikasi dengan menjalankan seed dua kali tanpa baris duplikat

## 3. Frontend

- [x] 3.1 Buat proyek Vite dengan versi `docs/ITA.md`, termasuk TypeScript `~6.0.3`, `strict`, dan `noUncheckedIndexedAccess`; verifikasi dengan `npm ci` dan `npm run build`
- [x] 3.2 Pasang ESLint, Prettier, dan Vitest dengan semua script US-001, termasuk larangan impor MapLibre di luar `features/entities/map/`; verifikasi dengan `npm run lint` dan `npm run format:check`, serta satu impor terlarang yang benar-benar ditolak lalu dihapus
- [x] 3.3 Buat `lib/env.ts` dan `api/client.ts`, dengan test untuk env tidak valid, respons sukses, respons error berenvelope, dan respons non-JSON; verifikasi dengan `npm test`
- [x] 3.4 Buat token dasar di `index.css` dan halaman awal dengan status memuat, terhubung, dan gagal terhubung, dengan test berbasis role dan teks; verifikasi dengan `npm test`

## 4. Container

- [ ] 4.1 Buat `backend/Dockerfile` dan `frontend/Dockerfile` multi-stage dan non-root, serta `nginx.conf`; verifikasi dengan `docker compose build` dan `whoami` di tiap container
- [ ] 4.2 Buat `docker-compose.yml` dengan healthcheck, `depends_on`, volume bernama, port dari `.env`, dan `platform: linux/amd64` untuk database; verifikasi dengan `docker compose up --build --wait` memakai salinan `.env.example`
- [ ] 4.3 Buktikan 503 tanpa detail internal dengan `docker compose stop db`, lalu `curl` ke `/api/v1/health`
- [ ] 4.4 Buktikan data bertahan: tambahkan satu baris lewat seed, jalankan `docker compose down`, jalankan kembali, lalu periksa barisnya masih ada
- [ ] 4.5 Buktikan database kosong: jalankan Compose dengan nama project terpisah untuk mendapat volume baru, periksa tabel `entities`, lalu hapus hanya volume project uji itu setelah meminta konfirmasi pemilik proyek

## 5. Test end-to-end dan otomasi

- [ ] 5.1 Buat `playwright.config.ts` dan test yang membuka halaman serta melihat status backend terhubung; verifikasi dengan `npm run test:e2e` terhadap Compose
- [x] 5.2 Tambahkan ekosistem `gomod` dan `npm` ke `.github/dependabot.yml`; verifikasi dengan actionlint yang tetap lulus dan YAML yang valid

## 6. Dokumen

- [x] 6.1 Perbarui `docs/GUIDE.md` dan `README.md` sesuai perintah yang benar-benar diuji, termasuk seed dan pembuatan database test pada volume lama; verifikasi dengan menjalankan perintah yang ditulis
- [x] 6.2 Selaraskan dokumen: `docs/DATABASE.md` §5 tentang seed manual, kriteria E2E US-002 yang masih memakai data seed, dan `CLAUDE.md` tentang `db/init/` serta perintah golangci-lint lokal; verifikasi dengan pemeriksaan link
- [x] 6.3 Perbarui `CHANGELOG.md`, status US-001, dan `docs/AI_USAGE.md` berdasarkan hasil nyata; verifikasi dengan membaca ulang setiap klaim terhadap hasil task

## 7. Pemeriksaan akhir

- [x] 7.1 Jalankan semua pemeriksaan backend dan frontend pada bagian Perintah di `CLAUDE.md`, dan laporkan yang tidak dapat dijalankan
- [ ] 7.2 Setelah pemilik proyek menyetujui push, buka Pull Request dan buktikan job `backend`, `frontend`, `e2e`, `changelog`, `secrets`, `docs`, dan `ci-success` lulus

## Workflow follow-up

- Jalankan `/opsx:verify` terhadap change ini.
- Jalankan `/opsx:archive` setelah verifikasi sesuai.
