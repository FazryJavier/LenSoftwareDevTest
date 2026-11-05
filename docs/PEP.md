# PEP — Project Execution Plan

Rencana ini menjelaskan urutan kerja, kontrol kualitas, dan risiko sampai hasil dikirim.

## 1. Tenggat

Soal memberi waktu **2 hari setelah soal diterima**. File soal tercatat pada 5 November 2026, sehingga target kerja adalah **7 November 2026**. Tanggal pasti mengikuti waktu penerimaan email.

## 2. Tahapan

| Fase | Keluaran | User story | Status |
|---|---|---|---|
| 0. Fondasi dokumen | `docs/`, `CLAUDE.md`, OpenSpec, CI | — | Selesai |
| 1. Fondasi aplikasi | Docker Compose, skeleton backend dan frontend, migrasi | US-001 | Sedang dikerjakan |
| 2. Lihat data | API list dan detail, peta, panel detail | US-002, US-003 | Selesai |
| 3. Kelola data | Tambah, ubah, hapus | US-004, US-005, US-006 | Selesai |
| 4. Validasi | Pengujian lintas layer untuk semua aturan | US-007 | Selesai |
| 5. Tambahan | Filter jenis dan status | US-008 | Selesai |
| 6. Penyelesaian | Uji end-to-end, finalisasi dokumen, pengiriman | — | Belum mulai |

Validasi dibangun bersama fitur tambah dan ubah pada fase 3. Fase 4 memastikan seluruh aturan [PRD §5](PRD.md#5-aturan-validasi) sudah tercakup.

## 3. Prioritas bila waktu sempit

Urutan pemotongan, dari yang pertama dikorbankan:

1. Uji end-to-end Playwright diperkecil menjadi satu skenario CRUD.
2. US-008 (filter).
3. Drag marker pada US-005. Perubahan lokasi tetap tersedia dengan klik peta dan input koordinat.

Fitur yang dipotong wajib dicatat pada bagian status di [README](../README.md).

## 4. Kontrol kualitas

Definition of Done untuk setiap user story:

- [ ] Change OpenSpec sudah dibuat dan divalidasi.
- [ ] Kriteria penerimaan user story terpenuhi dan terbukti lewat uji.
- [ ] Test mencakup jalur sukses, gagal, validasi, dan edge case.
- [ ] CI hijau.
- [ ] Dokumen terkait diperbarui bila perilaku berubah.
- [ ] [CHANGELOG](../CHANGELOG.md) dan [AI_USAGE](AI_USAGE.md) diperbarui.

## 5. Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Layanan tile OpenFreeMap tidak tersedia | Peta kosong, tetapi marker dan data tetap berjalan | URL style dapat diganti lewat `VITE_MAP_STYLE_URL` |
| Port bentrok di mesin reviewer | Aplikasi gagal jalan | Port dapat diatur lewat `.env` |
| Versi library baru tidak kompatibel | Build gagal | Versi dikunci di lockfile; hasil cek ada di [ITA §3](ITA.md#3-hasil-cek-kompatibilitas) |
| Hasil AI keliru | Bug atau dokumentasi tidak akurat | Setiap perubahan diuji dan ditinjau kandidat; lihat [WORKFLOW](WORKFLOW.md) |
| Waktu habis | Fitur tidak lengkap | Ikuti urutan pada §3 dan catat di README |

## 6. Deliverable pengiriman

- [ ] Repository `FazryJavier/LenSoftwareDevTest` dapat diakses oleh penilai.
- [ ] README berisi cara menjalankan, alasan library, penggunaan Agentic AI, dan status fitur.
- [ ] `CLAUDE.md` ada di root repository.
- [ ] Tautan repository dikirim ke `ibnu.mukhtarom@len-iot.io` dan `muhammad.padmanaba@len-iot.io`.
