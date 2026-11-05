# Design

## Context

Panel, dialog, dan pola mutation sudah tersedia dari US-003 sampai US-005. Dokumen ini hanya mencatat keputusan khusus untuk menghapus.

## Goals / Non-Goals

**Goals:**

- Membuat penghapusan sulit terjadi tanpa sengaja, dan jujur saat gagal.

**Non-Goals:**

- Soft delete, karena tidak dibutuhkan soal.

## Decisions

**1. `DELETE` membalas 200, bukan 204.** Envelope tetap konsisten, sesuai `docs/API.md`.

**2. `EntityStore.Delete` memakai `Exec` dan memeriksa jumlah baris.** Nol baris berarti `domain.ErrNotFound`, sehingga tidak perlu `SELECT` lebih dulu.

**3. 404 saat menghapus diperlakukan sebagai selesai.** Tujuan pengguna sudah tercapai, sehingga panel ditutup, peta diperbarui, dan pesannya menyatakan entitas sudah tidak ada.

**4. Fokus kembali ke tombol Tambah setelah dihapus.** Marker pemicunya sudah tidak ada, sehingga fokus membutuhkan tujuan lain.

**5. `Esc` pada panel diabaikan selama ada dialog terbuka.** `Esc` hanya menutup dialog, bukan panel di belakangnya. Hal ini diuji di browser sungguhan.

**6. Test E2E membersihkan datanya lewat API.** `afterAll` menghapus entitas berawalan `E2E `, sehingga pembersihan manual lewat SQL tidak lagi diperlukan.

## Risks / Trade-offs

- [Penghapusan permanen tanpa pemulihan] → Dialog menyebut nama entitas, dan tombol hapus berwarna bahaya.
- [Pembersihan E2E berdasarkan awalan nama] → Entitas pengguna berawalan `E2E ` ikut terhapus bila test dijalankan pada database yang sama. Ini dicatat di `docs/GUIDE.md`.
