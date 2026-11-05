# Proposal

## Why

Aturan validasi ditulis dua kali, di Go dan Zod, sehingga keduanya bisa berbeda tanpa terlihat. US-007 (FR-7, NFR-3, BR-6) membuktikan bahwa frontend dan backend menerapkan aturan yang sama, dan bahwa semua kegagalan API memakai envelope standar.

## What Changes

- Menambah `testdata/validation-cases.json`, yaitu satu daftar kasus dari `docs/PRD.md` §5 yang dijalankan oleh test Go dan test Vitest.
- Menambah koleksi Postman yang menguji kontrak terhadap server yang berjalan, termasuk semua jenis kegagalan.
- Menjalankan koleksi itu di CI terhadap Compose, lewat Newman.
- Memperbaiki perbedaan aturan yang ditemukan oleh kasus bersama.

**Tidak termasuk:**

- Memakai satu kode aturan untuk dua bahasa. Aturan tetap ditulis di Go dan Zod, dan kesamaannya dibuktikan oleh kasus bersama.
- Mengunggah koleksi ke workspace Postman.

## Capabilities

### New Capabilities

- `validation-parity`: Jaminan bahwa frontend dan backend menerapkan aturan validasi yang sama, dan API selalu membalas dengan envelope standar.

### Modified Capabilities

Tidak ada.

## Impact

- **Test:** `testdata/`, test Go, test Vitest, dan `postman/`.
- **CI:** job `e2e` menjalankan koleksi Postman.
- **Dependensi:** Newman 6 dijalankan lewat `npx` di CI, tanpa masuk `package.json`.
- **Kode aplikasi:** hanya berubah bila kasus bersama menemukan perbedaan.
- **Database:** tidak ada perubahan.
- **Persetujuan:** pemilik proyek menyetujui US-006 sampai US-008 sekaligus pada 6 November 2026.
