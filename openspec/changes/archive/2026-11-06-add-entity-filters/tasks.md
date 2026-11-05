# Tasks

## 1. Backend

- [x] 1.1 Tambahkan `Types` dan `Statuses` pada `ListFilter`, serta parsing query, dengan table-driven test untuk satu nilai, banyak nilai, nilai kosong, dan nilai tidak dikenal; verifikasi dengan `go test ./internal/httpapi`
- [x] 1.2 Susun kondisi pada `EntityStore.List`, dengan test integrasi untuk jenis, status, banyak nilai, gabungan dengan `bbox`, pagination, dan `total`; verifikasi dengan `go test ./internal/store` terhadap PostGIS

## 2. Frontend

- [x] 2.1 Buat `useEntityFilters`, dengan test untuk membaca URL, menulis URL, parameter lain yang tetap ada, dan nilai tidak dikenal; verifikasi dengan `npm test`
- [x] 2.2 Teruskan filter lewat `listEntities` dan `useEntities`, dengan test bahwa request memuat filter; verifikasi dengan `npm test`
- [x] 2.3 Buat `EntityFilters` dan pesan kosong untuk filter, dengan test pilihan, Reset, dan pesan; verifikasi dengan `npm test`

## 3. Test end-to-end

- [x] 3.1 Tambahkan test browser dengan API sungguhan untuk memilih filter, memuat ulang, dan Reset, serta test parameter tidak valid lewat proxy dan koleksi Postman; verifikasi dengan `npm run test:e2e`
- [x] 3.2 Jalankan semua test terhadap build produksi, dan periksa filter pada ukuran desktop dan ponsel di browser sungguhan; verifikasi dengan screenshot

## 4. Dokumen

- [x] 4.1 Perbarui `README.md`, `docs/GUIDE.md`, `CHANGELOG.md`, status US-008, dan `docs/AI_USAGE.md` sesuai hasil nyata; verifikasi dengan membaca ulang setiap klaim

## 5. Pemeriksaan akhir

- [x] 5.1 Jalankan semua pemeriksaan pada bagian Perintah di `CLAUDE.md`, dan laporkan yang tidak dapat dijalankan
- [x] 5.2 Buka Pull Request dengan auto-merge, dan buktikan semua job CI lulus

## Workflow follow-up

- Jalankan `/opsx:verify` terhadap change ini.
- Jalankan `/opsx:archive` setelah verifikasi sesuai.
