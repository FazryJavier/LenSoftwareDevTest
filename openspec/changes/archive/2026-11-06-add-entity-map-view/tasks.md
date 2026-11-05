# Tasks

## 1. Backend

- [x] 1.1 Buat `internal/domain` berisi `Entity`, enum, `ListFilter`, dan hasil pagination; verifikasi dengan `go build ./...`
- [x] 1.2 Buat `internal/store/entity_store.go` dengan `DBTX` dan `List`, dengan test integrasi dalam transaksi untuk urutan hasil, `bbox` termasuk titik di batas, pagination, `total`, data kosong, koordinat yang tidak tertukar, serta `description` null; verifikasi dengan `go test ./internal/store` terhadap PostGIS
- [x] 1.3 Buat parsing query di `httpapi/decode.go`, dengan table-driven test untuk nilai default, nilai batas, dan semua bentuk `bbox`, `page`, serta `per_page` yang tidak valid; verifikasi dengan `go test ./internal/httpapi`
- [x] 1.4 Buat `httpapi/dto.go` dan handler `GET /api/v1/entities`, dengan test store palsu untuk 200, `meta`, data kosong sebagai `[]`, 400, dan 500 tanpa detail internal; verifikasi dengan `go test ./internal/httpapi`
- [x] 1.5 Buat test integrasi gagal, bukan dilewati, bila `CI` disetel tetapi `TEST_DATABASE_URL` kosong; verifikasi dengan menjalankan test itu pada kedua kondisi

## 2. Frontend data

- [x] 2.1 Pasang `maplibre-gl`, `@vis.gl/react-maplibre`, dan `lucide-react`; verifikasi dengan `npm run build`
- [x] 2.2 Buat `schema.ts` dan `api.ts`, dengan test untuk respons valid dan respons yang tidak sesuai kontrak; verifikasi dengan `npm test`
- [x] 2.3 Buat fungsi pembentuk `bbox`, dengan test untuk batas normal, nilai melewati ±180 dan ±90, serta format string; verifikasi dengan `npm test`
- [x] 2.4 Buat `hooks.ts` dengan query key dan `keepPreviousData`, dengan test bahwa `bbox` masuk ke request dan data lama tetap ada saat memuat; verifikasi dengan `npm test`

## 3. Frontend tampilan

- [x] 3.1 Buat `constants.ts`, `EntityMarker`, dan komponen `Banner`, dengan test ikon, warna, dan label aksesibilitas untuk setiap jenis dan status; verifikasi dengan `npm test`
- [x] 3.2 Buat `EntityMap` dan `EntitiesPage` dengan keadaan memuat, kosong, gagal dengan coba lagi, dan peringatan batas, dengan test Vitest memakai peta yang di-mock; verifikasi dengan `npm test`
- [x] 3.3 Ganti `BackendStatus` dengan `EntitiesPage`, dan hapus komponen serta test lamanya; verifikasi dengan `npm run lint` dan `npm run typecheck`
- [x] 3.4 Perbarui CSP di `nginx.conf` sesuai kebutuhan MapLibre; verifikasi lewat job `e2e` yang berjalan di belakang nginx tanpa pelanggaran CSP

## 4. Test end-to-end

- [x] 4.1 Ganti smoke test: fixture API dan style memunculkan marker berlabel, peringatan batas, keadaan kosong, dan error dengan coba lagi; test juga gagal bila ada pelanggaran CSP di console; verifikasi dengan `npm run test:e2e` pada jalur lokal
- [x] 4.2 Tambahkan test `GET /api/v1/entities` sungguhan lewat proxy yang memeriksa envelope dan `meta`; verifikasi dengan `npm run test:e2e`
- [x] 4.3 Periksa manual di browser pada jalur lokal: peta dan tile tampil, 6 data contoh muncul di Bandung dan Jakarta, serta menggeser peta memuat ulang data; verifikasi dengan screenshot dan catat hasilnya

## 5. Dokumen dan otomasi

- [x] 5.1 Tambahkan ignore kenaikan mayor TypeScript pada `.github/dependabot.yml`; verifikasi dengan actionlint yang tetap lulus dan YAML yang valid
- [x] 5.2 Perbarui `README.md`, `docs/GUIDE.md` §2, dan bagian E2E pada US-002 sesuai hasil nyata; verifikasi dengan pemeriksaan link
- [x] 5.3 Perbarui `CHANGELOG.md`, status US-002, dan `docs/AI_USAGE.md`; verifikasi dengan membaca ulang setiap klaim terhadap hasil task

## 6. Pemeriksaan akhir

- [x] 6.1 Jalankan semua pemeriksaan pada bagian Perintah di `CLAUDE.md`, dan laporkan yang tidak dapat dijalankan
- [x] 6.2 Setelah pemilik proyek menyetujui push, buka Pull Request dan buktikan semua job CI lulus

## Workflow follow-up

- Jalankan `/opsx:verify` terhadap change ini.
- Jalankan `/opsx:archive` setelah verifikasi sesuai.
