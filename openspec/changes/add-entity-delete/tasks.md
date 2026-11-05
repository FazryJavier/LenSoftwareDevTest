# Tasks

## 1. Backend

- [x] 1.1 Buat `EntityStore.Delete`, dengan test integrasi untuk baris terhapus, baris lain tetap, dan penghapusan kedua yang menghasilkan `ErrNotFound`; verifikasi dengan `go test ./internal/store` terhadap PostGIS
- [x] 1.2 Buat handler dan rute `DELETE /api/v1/entities/{id}`, dengan test untuk 200, 400, 404, dan 500 tanpa detail internal; verifikasi dengan `go test ./internal/httpapi`

## 2. Frontend

- [x] 2.1 Buat `deleteEntity` dan `useDeleteEntity` dengan invalidasi list, serta `DeleteEntityDialog`, dengan test untuk nama pada dialog, batal tanpa request, berhasil, gagal dengan coba lagi, dan 404; verifikasi dengan `npm test`
- [x] 2.2 Tambahkan tombol Hapus pada panel detail, penutupan panel, pesan sukses, serta fokus ke tombol Tambah, dengan test; verifikasi dengan `npm test`

## 3. Test end-to-end

- [x] 3.1 Tambahkan test alur penuh dengan API sungguhan, batal, `Esc` pada dialog, gagal, dan 404, serta `DELETE` sungguhan lewat proxy; verifikasi dengan `npm run test:e2e`
- [x] 3.2 Tambahkan pembersihan data uji lewat API, lalu jalankan semua test terhadap build produksi; verifikasi bahwa tidak ada baris `E2E ` yang tersisa

## 4. Dokumen

- [x] 4.1 Perbarui `README.md`, `docs/GUIDE.md`, `CLAUDE.md`, `CHANGELOG.md`, status US-006, dan `docs/AI_USAGE.md` sesuai hasil nyata; verifikasi dengan membaca ulang setiap klaim terhadap hasil task

## 5. Pemeriksaan akhir

- [x] 5.1 Jalankan semua pemeriksaan pada bagian Perintah di `CLAUDE.md`, dan laporkan yang tidak dapat dijalankan
- [ ] 5.2 Buka Pull Request dengan auto-merge, dan buktikan semua job CI lulus

## Workflow follow-up

- Jalankan `/opsx:verify` terhadap change ini.
- Jalankan `/opsx:archive` setelah verifikasi sesuai.
