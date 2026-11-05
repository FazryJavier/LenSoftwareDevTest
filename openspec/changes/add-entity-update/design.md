# Design

## Context

Validasi, decoder, form, dan marker sementara sudah tersedia dari US-004. Dokumen ini hanya mencatat keputusan khusus untuk mengubah data.

## Goals / Non-Goals

**Goals:**

- Memakai ulang jalur validasi dan form, sehingga aturannya tetap satu.

**Non-Goals:**

- Mencegah perubahan bersamaan. `docs/PRD.md` §7 menetapkan penulis terakhir yang menang.

## Decisions

**1. `updated_at` memakai `clock_timestamp()`.** Di dalam transaksi, `now()` selalu sama dengan waktu awal transaksi, sehingga test integrasi tidak akan melihat perubahannya. `clock_timestamp()` juga benar untuk pemakaian sungguhan.

**2. `EntityStore.Update` memakai `UPDATE ... RETURNING`.** Baris kosong berarti `domain.ErrNotFound`, tanpa perlu `SELECT` terlebih dahulu.

**3. Urutan pemeriksaan handler: ID, body, aturan, lalu penyimpanan.** Dengan begitu, UUID rusak selalu menghasilkan 400 walau body juga rusak, dan database tidak disentuh untuk request yang tidak valid.

**4. `EntityForm` menerima `entity` opsional.** Bila ada, form berjalan sebagai mode ubah: berisi data entitas, memakai `PUT`, dan judulnya berubah. Tidak dibuat komponen form kedua. `toFormValues` mengubah angka menjadi teks, `null` menjadi teks kosong, dan objek atribut menjadi baris.

**5. Panel memiliki mode `edit`.** Tombol Ubah hanya tampil setelah detail termuat, dan form menerima entitas dari cache query yang sama. Batal dan simpan kembali ke `detail`. Prototype sudah menggambarkan alur ini.

**6. Selama mode ubah, marker entitas disembunyikan dan digantikan marker sementara.** Satu entitas tidak tampil di dua tempat. Saat batal, marker aslinya kembali dengan posisi lama karena datanya belum berubah.

**7. Marker sementara dapat digeser.** `Marker draggable` melaporkan posisi akhir lewat `onDragEnd`, memakai jalur yang sama dengan klik peta. Ini juga berlaku untuk mode tambah, karena komponennya sama dan perilakunya konsisten. Di `docs/PEP.md`, fitur ini adalah yang lebih dulu dipotong bila waktu sempit.

**8. Setelah berhasil, list dan detail entitas tersebut di-invalidate.** Marker dan panel menampilkan data tersimpan, bukan data form.

**9. `formErrors` membedakan 404.** Pesan umum "gagal disimpan" menyesatkan bila entitas sudah hilang, sehingga 404 mendapat pesan sendiri.

## Risks / Trade-offs

- [Dua pengguna mengubah entitas yang sama] → Penulis terakhir yang menang, sesuai PRD. Risiko ini dicatat dan tidak ditangani.
- [Klik peta saat menggeser memicu pindah lokasi dua kali] → Hasil akhirnya tetap posisi terakhir, sehingga aman. Dibuktikan lewat test E2E.
- [Data di form usang saat dibuka] → Form memakai data query terbaru yang tampil pada panel, dan pengguna dapat melihatnya sebelum memilih Ubah.
- [Entitas terpilih berada di luar area saat diubah] → Marker sementara tetap tampil pada koordinatnya, tetapi mungkin di luar layar. Koordinat tetap dapat dibaca pada form.
