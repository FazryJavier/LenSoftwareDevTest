# Design

## Context

`docs/ADR-004` menetapkan filter disimpan di URL. Kontrak `type` dan `status` sudah ada di `docs/openapi.yaml`.

## Decisions

**1. Kondisi SQL disusun dari potongan tetap.** `EntityStore.List` menggabungkan kondisi area, jenis, dan status, dengan nilai sebagai parameter. Teks SQL hanya berasal dari konstanta, dan `type = ANY($n)` menerima daftar nilai.

**2. Nilai filter divalidasi di `httpapi` memakai daftar dari `domain`.** Daftar yang sama dipakai validasi input, sehingga aturannya tetap satu.

**3. URL diperbarui dengan `history.replaceState`, tanpa router.** Satu halaman tidak membutuhkan library router, dan tombol kembali tidak berisi setiap perubahan filter.

**4. Nilai URL yang tidak dikenal diabaikan di frontend.** Tautan rusak tidak boleh menghasilkan error 400 pada pengguna. API tetap menolak nilai itu bila dipanggil langsung.

**5. Label aksesibilitas memakai "Filter jenis" dan "Filter status".** Form juga memiliki field Jenis dan Status, sehingga labelnya harus berbeda.

**6. Filter masuk ke query key.** Respons lama tidak menimpa pilihan baru, dan marker lama tetap tampil sampai data baru tiba.

## Risks / Trade-offs

- [Entitas terpilih tidak cocok dengan filter baru] → Panel detail tetap terbuka walau markernya hilang, karena panel mengambil datanya sendiri.
- [Entitas baru tidak cocok dengan filter aktif] → Panel menampilkan entitas baru, tetapi markernya tidak tampil sampai filter dihapus.
