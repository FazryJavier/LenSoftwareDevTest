# Design

## Context

Validasi sudah tersedia dari US-004, dengan test terpisah di Go dan Vitest. Test terpisah itu tidak dapat mendeteksi perbedaan antara keduanya.

## Decisions

**1. Kasus berbentuk JSON di `testdata/`.** Kedua bahasa dapat membacanya, dan menambah kasus hanya perlu satu baris. Kasus menulis perubahan terhadap entitas valid, dan penanda seperti `{"$repeat": "a", "count": 101}` menghindari teks panjang di file.

**2. Backend memeriksa `field` dan `code`, frontend memeriksa keputusan dan field utama.** Zod menghasilkan pesan, bukan kode API, sehingga kode hanya bermakna di backend. Field atribut dibandingkan pada akar `attributes`, karena form memakai baris dan API memakai key.

**3. Kasus tipe data salah hanya untuk backend.** Form selalu menghasilkan teks, sehingga `name: 123` tidak dapat terjadi di sana. Kasus seperti ini ditandai `"frontend": false`.

**4. Koleksi memakai format Postman v2.1.** Format ini dapat dijalankan oleh Newman di CI dan Postman CLI di lokal.

**5. Koleksi berjalan melewati nginx di CI.** Jalur ini sama dengan yang dipakai browser. Koleksi membuat lalu menghapus datanya sendiri.

**6. Newman lewat `npx` dengan versi terkunci.** Alat ini hanya dipakai CI, sehingga tidak perlu menambah dependensi frontend.

## Risks / Trade-offs

- [Kasus bersama tidak lengkap] → Kasus disusun per baris tabel PRD. Aturan baru tetap harus ditambahkan manual.
- [Newman tertinggal dari Postman CLI] → Koleksi hanya memakai fitur dasar `pm.test`.
