# Design

## Context

US-002 sudah menyediakan pola baca, marker berupa tombol, dan panel kosong pada `EntitiesPage`. Dokumen ini hanya mencatat keputusan yang belum tercakup di `docs/`.

## Goals / Non-Goals

**Goals:**

- Menyiapkan panel yang akan menampung form dan aksi pada US-004 sampai US-006.

**Non-Goals:**

- Membuat sistem panel umum atau state machine sebelum ada mode kedua.

## Decisions

**1. Panel melayang di atas peta, bukan membagi lebar peta.** Pada desktop lebarnya 360 px di sisi kanan, dan pada layar kecil menjadi bottom sheet. Membagi lebar akan mengubah ukuran peta, memicu `moveend`, dan memuat ulang data setiap kali panel dibuka. Trade-off: panel dapat menutupi sebagian marker.

**2. Panel selalu mengambil data lewat `GET /entities/{id}`.** Entitas pada daftar bisa saja sudah usang, dan kriteria 404 hanya bermakna dengan request sungguhan. Tidak memakai `keepPreviousData`, sehingga panel tidak menampilkan data entitas sebelumnya saat berganti pilihan.

**3. `retry: false` pada detail.** 404 adalah jawaban yang sah dan tidak boleh diulang. Kegagalan lain punya tombol coba lagi.

**4. Validasi UUID dengan regular expression di `decode.go`.** Cukup untuk membedakan 400 dari 404, dan mencegah PostgreSQL menolak nilai dengan error 500. *Alternatif:* paket uuid, yang menambah dependensi untuk satu pemeriksaan.

**5. Handler menerjemahkan `domain.ErrNotFound` menjadi 404.** Sesuai aturan `CLAUDE.md`, `store` mengubah `pgx.ErrNoRows` menjadi error domain.

**6. `selectedId` disimpan di `EntitiesPage`.** Entitas terpilih tetap terpilih saat peta digeser, walau markernya keluar dari area. Panel tetap menampilkan datanya.

**7. Fokus dipindahkan ke tombol tutup saat panel dibuka, dan kembali ke marker saat ditutup.** Marker dicari lewat `ref` milik elemen pemicu yang disimpan saat dipilih. Bila marker sudah keluar dari area, fokus kembali ke `body`.

**8. `Esc` ditangani lewat listener pada `document` selama panel terbuka.** Fokus pengguna bisa berada di peta atau marker, sehingga listener pada panel saja tidak cukup.

**9. Tanggal memakai `Intl.DateTimeFormat('id-ID')` dengan zona waktu perangkat.** Test menetapkan zona waktu secara eksplisit agar tidak bergantung pada mesin.

## Risks / Trade-offs

- [Marker bertumpuk sulit dipilih pada zoom rendah] → Pengguna memperbesar peta. Marker terpilih ditampilkan di atas marker lain.
- [Marker dibuat ulang saat data dimuat ulang, sehingga fokus hilang] → Marker memakai `key` tetap dari ID, sehingga elemennya dipertahankan.
- [Bottom sheet menutupi peta di ponsel] → Tinggi dibatasi setengah layar dan isinya dapat digulir.
