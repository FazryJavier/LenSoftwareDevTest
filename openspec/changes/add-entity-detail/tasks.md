# Tasks

## 1. Backend

- [x] 1.1 Buat `domain/errors.go` dan `EntityStore.Get`, dengan test integrasi dalam transaksi untuk entitas yang ada, koordinat yang tidak tertukar, dan `ErrNotFound`; verifikasi dengan `go test ./internal/store` terhadap PostGIS
- [x] 1.2 Tambahkan parsing ID, handler, dan rute `GET /api/v1/entities/{id}`, dengan test untuk 200, 404, 400, 500 tanpa detail internal, dan UUID huruf besar; verifikasi dengan `go test ./internal/httpapi`

## 2. Frontend

- [x] 2.1 Tambahkan `getEntity` dan `useEntity`, dengan test untuk respons valid, respons tidak sesuai kontrak, dan 404 yang tidak diulang; verifikasi dengan `npm test`
- [x] 2.2 Buat `EntityDetailPanel` dengan keadaan memuat, data lengkap, data opsional kosong, tidak ditemukan, dan gagal dengan coba lagi, dengan test termasuk nilai berisi HTML dan format tanggal; verifikasi dengan `npm test`
- [x] 2.3 Hubungkan pemilihan pada `EntityMarker`, `EntityMap`, dan `EntitiesPage`, dengan test untuk memilih, berganti marker tanpa data lama, menutup dengan tombol dan `Esc`, keadaan terpilih, serta kembalinya fokus; verifikasi dengan `npm test`

## 3. Test end-to-end

- [x] 3.1 Tambahkan test Playwright dengan fixture untuk membuka detail, berganti marker, menutup dengan `Esc`, dan 404; verifikasi dengan `npm run test:e2e`
- [x] 3.2 Tambahkan test endpoint sungguhan lewat proxy untuk 400 dan 404; verifikasi dengan `npm run test:e2e`
- [x] 3.3 Jalankan semua test Playwright terhadap build produksi, dan periksa panel dengan data contoh pada ukuran desktop dan ponsel; verifikasi dengan screenshot

## 4. Dokumen

- [x] 4.1 Perbarui aturan merge pada `CLAUDE.md` dan `docs/WORKFLOW.md`, serta status US-002; verifikasi dengan pemeriksaan link
- [x] 4.2 Perbarui `README.md`, `docs/GUIDE.md`, `CHANGELOG.md`, status US-003, dan `docs/AI_USAGE.md` sesuai hasil nyata; verifikasi dengan membaca ulang setiap klaim terhadap hasil task

## 5. Pemeriksaan akhir

- [x] 5.1 Jalankan semua pemeriksaan pada bagian Perintah di `CLAUDE.md`, dan laporkan yang tidak dapat dijalankan
- [ ] 5.2 Buka Pull Request dengan auto-merge, dan buktikan semua job CI lulus

## Workflow follow-up

- Jalankan `/opsx:verify` terhadap change ini.
- Jalankan `/opsx:archive` setelah verifikasi sesuai.
