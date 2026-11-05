# Design

## Context

Kontrak ada di `docs/openapi.yaml`, aturan validasi di `docs/PRD.md` §5, dan tampilan form di `docs/PROTOTYPE.md`. Panel dan pemilihan marker berasal dari US-003. Dokumen ini hanya mencatat keputusan yang belum tercakup di sana.

## Goals / Non-Goals

**Goals:**

- Membangun jalur tulis dan validasi yang akan dipakai ulang oleh US-005.

**Non-Goals:**

- Membagi kode aturan validasi antara Go dan TypeScript. Keduanya mengikuti tabel PRD, dan kesamaannya diuji pada US-007.

## Decisions

**1. Decode bertahap.** Urutannya: `Content-Type` (415), `http.MaxBytesReader` 64 KiB (413), lalu `json.Decoder` dengan `DisallowUnknownFields`. Pemanggilan decode kedua memastikan tidak ada data tambahan setelah objek. Kode tidak bergantung pada teks error kecuali untuk `unknown_field`, yang tidak memiliki tipe error sendiri di `encoding/json`.

**2. Input dibaca tanpa tipe.** Rencana awal memakai pointer bertipe dan `json.UnmarshalTypeError`, tetapi decoder hanya melaporkan satu kesalahan tipe. Semua field kini didekode sebagai `any`, lalu `domain` memeriksa tipe dan aturan sekaligus, sehingga semua pelanggaran dilaporkan bersama dan nilai kosong tetap dapat dibedakan dari `0`.

**3. `domain.Validate` mengembalikan semua pelanggaran.** Fungsi ini murni dan tidak mengetahui HTTP. Hasilnya berupa daftar pelanggaran yang diubah `httpapi` menjadi `errors`. Panjang teks dihitung dalam karakter, bukan byte, agar sesuai PRD untuk teks non-ASCII.

**4. Normalisasi pada input.** Nama di-trim sebelum validasi. Deskripsi kosong atau berisi spasi saja disimpan sebagai null.

**5. Handler membaca kembali lewat `RETURNING`.** Respons berasal dari baris tersimpan, sehingga `id`, waktu, dan koordinat adalah nilai yang sebenarnya.

**6. Nilai form berupa teks, dan skema Zod mengubahnya menjadi payload.** Input angka yang kosong tidak boleh menjadi `0`, dan koordinat `0` harus tetap sah. Input memakai `inputmode="decimal"`, bukan `type="number"`, agar kesalahan ketik dapat dilaporkan.

**7. Pesan error mengikuti `code`.** Frontend memetakan `code` ke pesan Bahasa Indonesia, sesuai `docs/DESIGN_SYSTEM.md` §7, dan memakai `message` server sebagai cadangan. Error dengan `field` di luar form, seperti `attributes.x`, ditampilkan pada bagian atribut.

**8. Mode panel: `idle`, `detail`, atau `create`.** Status ini menggantikan `selectedId`, sehingga panel hanya menampilkan satu hal. Selama mode `create`, memilih marker tidak membuka detail agar isi form tidak hilang.

**9. Klik peta memakai `onClick` pada `Map`.** Klik di luar rentang koordinat menghasilkan pesan validasi pada form. Test E2E membuktikan bahwa klik marker selama mode tambah tidak membuka detail dan tidak menutup form.

**10. Setelah berhasil, list di-invalidate dan panel membuka detail entitas baru.** Marker baru muncul setelah refetch, bukan lewat pembaruan optimistis, sehingga UI hanya menampilkan data yang benar-benar tersimpan.

**11. `Dialog` memakai elemen `<dialog>` native,** dan `Toast` sederhana tanpa library. Keduanya sudah direncanakan di `docs/DESIGN_SYSTEM.md`.

**12. E2E memakai API sungguhan untuk alur tambah.** Test membuat entitas dengan nama unik, memeriksa marker, lalu memuat ulang halaman untuk membuktikan data tersimpan. Base map tetap di-stub. Ini juga memenuhi janji US-002 tentang marker dari data sungguhan. Pembersihan data menyusul pada US-006.

## Risks / Trade-offs

- [Aturan validasi tertulis dua kali, di Go dan Zod] → Keduanya mengikuti PRD, dan US-007 menguji kesamaan kasusnya.
- [Klik peta di ponsel tertutup panel] → Panel dibatasi setengah layar, dan koordinat tetap dapat diketik.
- [Form panjang pada bottom sheet] → Isi panel dapat digulir.
- [Test E2E meninggalkan data di database lokal sampai US-006] → Nama test unik, dan CI selalu memakai database baru.
- [Skema frontend tidak sepenuhnya sama dengan backend] → Backend tetap menjadi penentu akhir, dan 422 ditampilkan pada form.
