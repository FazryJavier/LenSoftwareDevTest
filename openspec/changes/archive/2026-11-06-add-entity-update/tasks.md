# Tasks

## 1. Backend

- [x] 1.1 Buat `EntityStore.Update` dengan `clock_timestamp()`, dengan test integrasi dalam transaksi untuk seluruh field terganti, koordinat yang tidak tertukar, `created_at` tetap, `updated_at` berubah, atribut dan deskripsi yang dihapus, serta `ErrNotFound`; verifikasi dengan `go test ./internal/store` terhadap PostGIS
- [x] 1.2 Buat handler dan rute `PUT /api/v1/entities/{id}`, dengan test untuk 200, 400 ID rusak, 400 body rusak, 404, 413, 415, 422 tanpa memanggil store, dan 500 tanpa detail internal; verifikasi dengan `go test ./internal/httpapi`

## 2. Frontend data

- [x] 2.1 Buat `updateEntity`, `useUpdateEntity` dengan invalidasi list dan detail, `toFormValues`, serta pesan 404 pada `formErrors`, dengan test; verifikasi dengan `npm test`

## 3. Frontend tampilan

- [x] 3.1 Sesuaikan `EntityForm` untuk mode ubah, dengan test untuk nilai awal, `PUT` berisi payload, pesan 404, dan pembatalan tanpa request; verifikasi dengan `npm test`
- [x] 3.2 Tambahkan tombol Ubah pada `EntityDetailPanel` dan mode `edit` pada `usePanel`, dengan test bahwa batal dan simpan kembali ke detail; verifikasi dengan `npm test`
- [x] 3.3 Sembunyikan marker entitas selama mode ubah dan buat marker sementara dapat digeser, dengan test; verifikasi dengan `npm test`

## 4. Test end-to-end

- [x] 4.1 Tambahkan test alur penuh dengan API sungguhan: buat entitas, ubah nama dan lokasi lewat klik peta, simpan, dan data baru bertahan setelah muat ulang; verifikasi dengan `npm run test:e2e`
- [x] 4.2 Tambahkan test geser marker, batal mengembalikan marker, dan 404 saat simpan, serta test `PUT` sungguhan lewat proxy untuk 200, 400, 404, dan 422; verifikasi dengan `npm run test:e2e`
- [x] 4.3 Jalankan semua test Playwright terhadap build produksi, dan periksa mode ubah pada ukuran desktop dan ponsel di browser sungguhan; verifikasi dengan screenshot

## 5. Dokumen

- [x] 5.1 Perbarui `README.md`, `docs/GUIDE.md`, `CHANGELOG.md`, status US-005, dan `docs/AI_USAGE.md` sesuai hasil nyata; verifikasi dengan membaca ulang setiap klaim terhadap hasil task

## 6. Pemeriksaan akhir

- [x] 6.1 Jalankan semua pemeriksaan pada bagian Perintah di `CLAUDE.md`, dan laporkan yang tidak dapat dijalankan
- [x] 6.2 Buka Pull Request dengan auto-merge, dan buktikan semua job CI lulus

## Workflow follow-up

- Jalankan `/opsx:verify` terhadap change ini.
- Jalankan `/opsx:archive` setelah verifikasi sesuai.
