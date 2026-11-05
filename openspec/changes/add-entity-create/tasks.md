# Tasks

## 1. Backend

- [x] 1.1 Buat `EntityInput` dan `domain/validate.go`, dengan table-driven test untuk setiap baris `docs/PRD.md` §5, nilai batas, teks non-ASCII, dan banyak pelanggaran sekaligus; verifikasi dengan `go test ./internal/domain`
- [x] 1.2 Buat `EntityStore.Create` dengan `RETURNING`, dengan test integrasi dalam transaksi untuk seluruh field, koordinat yang tidak tertukar, koordinat nol, dan deskripsi null; verifikasi dengan `go test ./internal/store` terhadap PostGIS
- [x] 1.3 Buat decoder JSON di `httpapi/decode.go`, dengan test untuk 415, 413, JSON rusak, data tambahan, field tidak dikenal, dan tipe salah; verifikasi dengan `go test ./internal/httpapi`
- [x] 1.4 Buat handler dan rute `POST /api/v1/entities`, dengan test untuk 201, header `Location`, 422 berisi semua pelanggaran, normalisasi nama, dan 500 tanpa detail internal; verifikasi dengan `go test ./internal/httpapi`

## 2. Frontend data

- [x] 2.1 Pasang `react-hook-form` dan `@hookform/resolvers`; verifikasi dengan `npm run build`
- [x] 2.2 Buat skema form Zod dan pengubahan menjadi payload, dengan table-driven test untuk setiap baris `docs/PRD.md` §5, koordinat `0`, koordinat kosong, dan teks non-angka; verifikasi dengan `npm test`
- [x] 2.3 Buat `createEntity` dan `useCreateEntity` dengan invalidasi list, serta pemetaan `code` ke pesan, dengan test; verifikasi dengan `npm test`

## 3. Frontend tampilan

- [x] 3.1 Buat `Button`, `Field`, `Select`, `Dialog`, dan `Toast` sesuai `docs/DESIGN_SYSTEM.md`, dengan test label, keadaan nonaktif, dan pengumuman pembaca layar; verifikasi dengan `npm test`
- [x] 3.2 Buat `EntityForm`, dengan test untuk error frontend tanpa request, error 422 per field, kegagalan umum, tombol nonaktif saat request berjalan, dan atribut tambah serta hapus; verifikasi dengan `npm test`
- [x] 3.3 Ganti pemilihan dengan mode panel, serta tambahkan klik peta, marker sementara, dan konfirmasi batal pada `EntitiesPage` dan `EntityMap`, dengan test; verifikasi dengan `npm test`
- [x] 3.4 Tambahkan tombol Tambah pada header dan ajakan pada keadaan kosong, dengan test; verifikasi dengan `npm test`

## 4. Test end-to-end

- [x] 4.1 Tambahkan test alur penuh dengan API sungguhan: klik peta, isi form, simpan, marker tampil, dan data ada setelah muat ulang; verifikasi dengan `npm run test:e2e`
- [x] 4.2 Tambahkan test validasi, pembatalan, dan klik marker selama mode tambah, serta test `POST` sungguhan lewat proxy untuk 201, 400, 415, dan 422; verifikasi dengan `npm run test:e2e`
- [x] 4.3 Jalankan semua test Playwright terhadap build produksi, dan periksa form pada ukuran desktop dan ponsel di browser sungguhan; verifikasi dengan screenshot

## 5. Dokumen

- [x] 5.1 Perbarui `README.md`, `docs/GUIDE.md`, `CHANGELOG.md`, status US-004, dan `docs/AI_USAGE.md` sesuai hasil nyata; verifikasi dengan membaca ulang setiap klaim terhadap hasil task

## 6. Pemeriksaan akhir

- [x] 6.1 Jalankan semua pemeriksaan pada bagian Perintah di `CLAUDE.md`, dan laporkan yang tidak dapat dijalankan
- [ ] 6.2 Buka Pull Request dengan auto-merge, dan buktikan semua job CI lulus

## Workflow follow-up

- Jalankan `/opsx:verify` terhadap change ini.
- Jalankan `/opsx:archive` setelah verifikasi sesuai.
