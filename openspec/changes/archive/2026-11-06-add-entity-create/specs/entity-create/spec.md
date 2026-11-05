# Spec Delta

## Purpose

Memungkinkan operator menambah entitas dengan memilih titik di peta, dengan memastikan data tidak valid ditolak di frontend dan backend.

## ADDED Requirements

### Requirement: API membuat entitas
Sistem SHALL menyediakan `POST /api/v1/entities` yang menyimpan entitas valid dan membalas 201 dengan entitas tersebut pada `data` serta header `Location`.

#### Scenario: Data valid
- **WHEN** `POST /api/v1/entities` dipanggil dengan data valid
- **THEN** respons berstatus 201, `data` berisi entitas dengan `id`, dan header `Location` menunjuk ke entitas itu
- **AND** `GET` pada lokasi tersebut mengembalikan data yang sama, dengan latitude dan longitude yang tidak tertukar

#### Scenario: Hanya field wajib
- **WHEN** `description` dan `attributes` tidak dikirim
- **THEN** entitas tersimpan dengan `description` null dan `attributes` berupa objek kosong

#### Scenario: Koordinat nol
- **WHEN** `latitude` dan `longitude` bernilai 0
- **THEN** entitas tersimpan pada koordinat 0,0

#### Scenario: Spasi tepi pada nama
- **WHEN** `name` diawali atau diakhiri spasi
- **THEN** entitas tersimpan dengan nama tanpa spasi tepi

### Requirement: API menolak data yang melanggar aturan
Sistem SHALL membalas 422 dengan semua pelanggaran pada `errors`, masing-masing memuat `field`, `code`, dan `message` sesuai aturan pada `docs/PRD.md` §5, dan SHALL tidak menyimpan apa pun.

#### Scenario: Field wajib kosong
- **WHEN** `name`, `type`, `status`, `latitude`, atau `longitude` tidak dikirim
- **THEN** respons berstatus 422 dengan kode `required` untuk setiap field tersebut

#### Scenario: Nilai di luar aturan
- **WHEN** koordinat di luar rentang, enum tidak dikenal, teks terlalu panjang, atau key atribut tidak valid
- **THEN** respons berstatus 422 dengan kode `out_of_range`, `invalid_enum`, `too_long`, atau `invalid_format` pada field terkait

#### Scenario: Nilai tepat di batas
- **WHEN** latitude 90 atau -90, longitude 180 atau -180, nama 100 karakter, atau 20 atribut dikirim
- **THEN** entitas tersimpan

#### Scenario: Tipe data salah
- **WHEN** `latitude` berupa teks, atau nilai atribut bukan teks
- **THEN** respons berstatus 422 dengan kode `invalid_type` pada field terkait

### Requirement: API menolak request yang tidak dapat diproses
Sistem SHALL menolak request yang rusak dengan envelope standar dan kode status yang sesuai.

#### Scenario: JSON rusak
- **WHEN** body bukan JSON yang valid, atau berisi data tambahan setelah objek
- **THEN** respons berstatus 400 dengan kode `malformed_json`

#### Scenario: Field tidak dikenal
- **WHEN** body memuat field di luar kontrak
- **THEN** respons berstatus 400 dengan kode `unknown_field`

#### Scenario: Content-Type salah
- **WHEN** `Content-Type` bukan `application/json`
- **THEN** respons berstatus 415 dengan kode `unsupported_media_type`

#### Scenario: Body terlalu besar
- **WHEN** body melebihi 64 KiB
- **THEN** respons berstatus 413 dengan kode `payload_too_large`

### Requirement: Lokasi dipilih pada peta
Sistem SHALL mengisi koordinat form saat pengguna mengklik peta dalam mode tambah, dan menampilkan marker sementara pada koordinat form.

#### Scenario: Klik peta
- **GIVEN** form tambah terbuka
- **WHEN** pengguna mengklik peta
- **THEN** latitude dan longitude terisi, dan marker sementara tampil pada titik tersebut

#### Scenario: Ketik koordinat
- **GIVEN** form tambah terbuka
- **WHEN** pengguna mengetik koordinat yang valid
- **THEN** marker sementara berpindah ke titik tersebut

### Requirement: Form menyimpan entitas
Sistem SHALL menyimpan data valid, menampilkan marker baru dan detail entitas, serta menampilkan pesan sukses.

#### Scenario: Penyimpanan berhasil
- **WHEN** pengguna menyimpan data valid
- **THEN** form tertutup, panel menampilkan entitas baru, marker baru tampil, dan pesan sukses muncul

#### Scenario: Request sedang berjalan
- **WHEN** pengguna menekan simpan lagi saat request berjalan
- **THEN** tidak ada request tambahan

### Requirement: Form menampilkan kesalahan per field
Sistem SHALL menampilkan pesan pada field terkait, baik dari validasi frontend maupun respons server, tanpa menghilangkan isi form.

#### Scenario: Validasi frontend gagal
- **WHEN** pengguna menyimpan data tidak valid
- **THEN** tidak ada request yang dikirim, dan pesan tampil pada field terkait

#### Scenario: Server menolak data
- **WHEN** server membalas 422
- **THEN** pesan tampil pada field terkait, dan isi form tetap ada

#### Scenario: Kegagalan lain
- **WHEN** server gagal karena sebab lain
- **THEN** pesan error umum tampil, isi form tetap ada, dan pengguna dapat mencoba lagi

### Requirement: Pembatalan meminta konfirmasi bila ada perubahan
Sistem SHALL meminta konfirmasi saat pengguna membatalkan form yang berisi perubahan, dan langsung menutup form yang belum berubah.

#### Scenario: Form berisi perubahan
- **WHEN** pengguna membatalkan form yang berisi perubahan, lalu mengonfirmasi
- **THEN** form dan marker sementara hilang

#### Scenario: Konfirmasi ditolak
- **WHEN** pengguna membatalkan form lalu menolak konfirmasi
- **THEN** form dan isinya tetap ada

#### Scenario: Form belum berubah
- **WHEN** pengguna membatalkan form yang belum berubah
- **THEN** form langsung tertutup tanpa konfirmasi
