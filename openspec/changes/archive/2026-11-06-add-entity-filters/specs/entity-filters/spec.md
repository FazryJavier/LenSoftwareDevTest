# Spec Delta

## Purpose

Memungkinkan operator membatasi entitas pada peta menurut jenis dan status, agar dapat fokus pada objek tertentu.

## ADDED Requirements

### Requirement: API memfilter menurut jenis dan status
Sistem SHALL membatasi `GET /api/v1/entities` menurut `type` dan `status`, yang masing-masing menerima satu atau lebih nilai dipisah koma.

#### Scenario: Satu nilai
- **WHEN** `type=vehicle` dikirim
- **THEN** hanya entitas berjenis kendaraan yang dikembalikan, dan `meta.total` menghitung entitas tersebut saja

#### Scenario: Banyak nilai
- **WHEN** `status=active,maintenance` dikirim
- **THEN** entitas dengan salah satu status itu dikembalikan

#### Scenario: Digabung dengan area
- **WHEN** `type`, `status`, dan `bbox` dikirim bersamaan
- **THEN** hanya entitas yang memenuhi ketiganya yang dikembalikan

#### Scenario: Nilai tidak valid
- **WHEN** `type` atau `status` kosong atau berisi nilai di luar daftar
- **THEN** respons berstatus 400 dengan error berkode `invalid_query` dan `field` berisi nama parameter

### Requirement: Peta dapat difilter
Sistem SHALL hanya menampilkan entitas yang cocok dengan pilihan jenis dan status pada peta.

#### Scenario: Memilih filter
- **WHEN** pengguna memilih jenis atau status
- **THEN** hanya entitas yang cocok tampil

#### Scenario: Dua filter aktif
- **WHEN** jenis dan status sama-sama dipilih
- **THEN** entitas harus cocok dengan keduanya

#### Scenario: Menghapus filter
- **GIVEN** filter aktif
- **WHEN** pengguna memilih Reset
- **THEN** filter terhapus dan semua entitas pada area kembali tampil

### Requirement: Filter tersimpan di URL
Sistem SHALL menyimpan filter pada URL, dan menerapkannya saat halaman dimuat.

#### Scenario: Muat ulang atau tautan dibagikan
- **GIVEN** URL memuat filter
- **WHEN** halaman dimuat
- **THEN** pilihan dan isi peta mengikuti filter tersebut

#### Scenario: Nilai URL tidak dikenal
- **WHEN** URL memuat nilai filter yang tidak dikenal
- **THEN** nilai itu diabaikan, dan halaman tetap berfungsi tanpa error

### Requirement: Pesan kosong sesuai keadaan
Sistem SHALL menyatakan bila tidak ada entitas yang cocok dengan filter, dan menawarkan penghapusan filter.

#### Scenario: Filter tidak cocok
- **GIVEN** filter aktif
- **WHEN** tidak ada entitas yang cocok pada area
- **THEN** pesan menyatakan tidak ada yang cocok, dan tombol untuk menghapus filter tersedia
