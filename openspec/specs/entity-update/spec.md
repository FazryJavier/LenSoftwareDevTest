# entity-update Specification

## Purpose
Memungkinkan operator mengubah data dan lokasi entitas yang sudah ada, agar informasinya tetap sesuai dengan kondisi nyata.

## Requirements

### Requirement: API mengganti data entitas
Sistem SHALL menyediakan `PUT /api/v1/entities/{id}` yang mengganti seluruh data entitas valid dan membalas 200 dengan entitas yang tersimpan.

#### Scenario: Data valid
- **WHEN** `PUT /api/v1/entities/{id}` dipanggil dengan data valid
- **THEN** respons berstatus 200 dan `data` berisi nilai baru, dengan latitude dan longitude yang tidak tertukar
- **AND** `updated_at` berubah, sedangkan `id` dan `created_at` tetap

#### Scenario: Field opsional tidak dikirim
- **GIVEN** entitas memiliki deskripsi dan atribut
- **WHEN** `PUT` dikirim tanpa `description` dan `attributes`
- **THEN** `description` menjadi null dan `attributes` menjadi objek kosong

#### Scenario: Entitas tidak ditemukan
- **WHEN** `PUT` dikirim dengan data valid untuk UUID yang tidak ada
- **THEN** respons berstatus 404 dengan error berkode `not_found`

#### Scenario: ID tidak valid
- **WHEN** `PUT` dikirim dengan nilai yang bukan UUID
- **THEN** respons berstatus 400 dengan error berkode `invalid_id`

### Requirement: API menolak perubahan yang tidak valid
Sistem SHALL menerapkan aturan validasi dan penanganan request yang sama seperti pembuatan entitas, dan SHALL tidak mengubah data bila ditolak.

#### Scenario: Melanggar aturan
- **WHEN** `PUT` dikirim dengan data yang melanggar aturan
- **THEN** respons berstatus 422 dengan semua pelanggaran, dan data entitas tidak berubah

#### Scenario: Request rusak
- **WHEN** `PUT` dikirim dengan JSON rusak, field tidak dikenal, `Content-Type` salah, atau body terlalu besar
- **THEN** respons berstatus 400, 415, atau 413 sesuai kasusnya

### Requirement: Form berisi data saat ini
Sistem SHALL membuka form berisi data entitas saat ini ketika pengguna memilih Ubah pada panel detail.

#### Scenario: Membuka form
- **GIVEN** panel detail terbuka
- **WHEN** pengguna memilih Ubah
- **THEN** semua field, termasuk koordinat dan atribut, terisi data entitas tersebut

#### Scenario: Data opsional kosong
- **GIVEN** entitas tanpa deskripsi dan atribut
- **WHEN** form dibuka
- **THEN** deskripsi kosong dan tidak ada baris atribut

### Requirement: Lokasi dapat dipindahkan
Sistem SHALL menjaga posisi marker dan nilai koordinat form tetap sama saat lokasi diubah.

#### Scenario: Klik peta
- **GIVEN** mode ubah
- **WHEN** pengguna mengklik peta
- **THEN** koordinat form berubah dan marker pindah ke titik tersebut

#### Scenario: Ketik koordinat
- **GIVEN** mode ubah
- **WHEN** pengguna mengetik koordinat yang valid
- **THEN** marker pindah ke titik tersebut

#### Scenario: Geser marker
- **GIVEN** mode ubah
- **WHEN** pengguna menggeser marker
- **THEN** koordinat form mengikuti posisi akhir marker

### Requirement: Perubahan tersimpan terlihat di peta
Sistem SHALL menampilkan data baru pada panel detail dan marker setelah penyimpanan berhasil.

#### Scenario: Penyimpanan berhasil
- **WHEN** pengguna menyimpan perubahan valid
- **THEN** panel kembali ke detail berisi data baru, marker berada di posisi baru, dan pesan sukses muncul

#### Scenario: Data tetap ada setelah muat ulang
- **GIVEN** perubahan sudah disimpan
- **WHEN** halaman dimuat ulang
- **THEN** entitas tampil dengan data baru

### Requirement: Pembatalan tidak mengubah data
Sistem SHALL mengembalikan panel ke detail dan marker ke posisi semula saat pengguna membatalkan, dengan konfirmasi bila form berisi perubahan.

#### Scenario: Batal setelah berubah
- **GIVEN** nama dan lokasi sudah diubah pada form
- **WHEN** pengguna membatalkan dan mengonfirmasi
- **THEN** panel menampilkan data lama, marker kembali ke posisi semula, dan tidak ada request `PUT`

### Requirement: Entitas yang sudah hilang dilaporkan
Sistem SHALL memberi tahu pengguna bila entitas sudah tidak ada saat disimpan, tanpa menghilangkan isi form.

#### Scenario: Dihapus pihak lain
- **WHEN** server membalas 404 saat perubahan disimpan
- **THEN** form menyatakan bahwa entitas tidak ditemukan, dan isinya tetap ada
