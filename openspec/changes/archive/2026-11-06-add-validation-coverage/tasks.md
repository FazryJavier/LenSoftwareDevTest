# Tasks

## 1. Kasus bersama

- [x] 1.1 Buat `testdata/validation-cases.json` per baris `docs/PRD.md` §5, termasuk nilai batas; verifikasi bahwa file dibaca oleh kedua test di bawah
- [x] 1.2 Tambahkan test Go yang menjalankan semua kasus, dengan `field` dan `code`; verifikasi dengan `go test ./internal/domain`
- [x] 1.3 Tambahkan test Vitest yang menjalankan semua kasus frontend; verifikasi dengan `npm test`
- [x] 1.4 Perbaiki perbedaan aturan yang ditemukan, atau catat bila tidak ada; verifikasi dengan kedua test di atas

## 2. Kontrak

- [x] 2.1 Buat koleksi Postman untuk alur CRUD dan semua jenis kegagalan; verifikasi dengan Newman dan Postman CLI terhadap server lokal
- [x] 2.2 Jalankan koleksi di job `e2e`; verifikasi dengan actionlint dan CI

## 3. Dokumen

- [x] 3.1 Perbarui `docs/API.md`, `docs/ITA.md`, `docs/WORKFLOW.md`, `CLAUDE.md`, `README.md`, `CHANGELOG.md`, status US-007, dan `docs/AI_USAGE.md` sesuai hasil nyata; verifikasi dengan membaca ulang setiap klaim

## 4. Pemeriksaan akhir

- [x] 4.1 Jalankan semua pemeriksaan pada bagian Perintah di `CLAUDE.md`, dan laporkan yang tidak dapat dijalankan
- [x] 4.2 Buka Pull Request dengan auto-merge, dan buktikan semua job CI lulus

## Workflow follow-up

- Jalankan `/opsx:verify` terhadap change ini.
- Jalankan `/opsx:archive` setelah verifikasi sesuai.
