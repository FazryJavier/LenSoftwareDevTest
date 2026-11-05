# Spec Delta

## Purpose

Memungkinkan operator menghapus entitas yang tidak lagi dipakai, dengan konfirmasi agar tidak terjadi penghapusan tanpa sengaja.

## ADDED Requirements

### Requirement: API menghapus entitas
Sistem SHALL menyediakan `DELETE /api/v1/entities/{id}` yang menghapus entitas secara permanen dan membalas 200 dengan `data` null.

#### Scenario: Entitas ada
- **WHEN** `DELETE` dipanggil untuk entitas yang ada
- **THEN** respons berstatus 200 dengan `data` null, dan `GET` pada entitas itu membalas 404

#### Scenario: Penghapusan kedua
- **WHEN** `DELETE` dipanggil untuk entitas yang sudah dihapus
- **THEN** respons berstatus 404 dengan error berkode `not_found`

#### Scenario: ID tidak valid
- **WHEN** `DELETE` dipanggil dengan nilai yang bukan UUID
- **THEN** respons berstatus 400 dengan error berkode `invalid_id`

### Requirement: Penghapusan meminta konfirmasi
Sistem SHALL menampilkan dialog konfirmasi yang menyebut nama entitas sebelum menghapus.

#### Scenario: Meminta hapus
- **GIVEN** panel detail terbuka
- **WHEN** pengguna memilih Hapus
- **THEN** dialog konfirmasi menampilkan nama entitas, dan belum ada request

#### Scenario: Konfirmasi ditolak
- **WHEN** pengguna membatalkan dialog, termasuk dengan `Esc`
- **THEN** dialog tertutup, panel tetap terbuka, tidak ada request, dan data tidak berubah

### Requirement: Hasil penghapusan terlihat di peta
Sistem SHALL menghilangkan marker, menutup panel, dan menampilkan pesan sukses setelah penghapusan berhasil.

#### Scenario: Berhasil
- **WHEN** pengguna mengonfirmasi dan penghapusan berhasil
- **THEN** marker hilang, panel tertutup, dan pesan sukses muncul

#### Scenario: Data tetap hilang setelah muat ulang
- **GIVEN** entitas sudah dihapus
- **WHEN** halaman dimuat ulang
- **THEN** marker entitas tersebut tidak tampil

### Requirement: Kegagalan penghapusan ditangani
Sistem SHALL mempertahankan marker dan menampilkan pesan error saat penghapusan gagal, dan memberi tahu pengguna bila entitas sudah tidak ada.

#### Scenario: Gagal
- **WHEN** penghapusan gagal karena kesalahan server atau jaringan
- **THEN** dialog menampilkan pesan error, marker tetap ada, dan pengguna dapat mencoba lagi

#### Scenario: Sudah dihapus pihak lain
- **WHEN** server membalas 404 saat penghapusan
- **THEN** panel tertutup, peta diperbarui, dan pengguna diberi tahu bahwa entitas sudah tidak ada
