# entity-detail Specification

## Purpose
Memungkinkan operator membaca informasi lengkap satu entitas dari peta, dan menyediakan API untuk mengambil satu entitas menurut ID.

## Requirements

### Requirement: API mengembalikan satu entitas
Sistem SHALL menyediakan `GET /api/v1/entities/{id}` yang mengembalikan entitas pada `data` dengan bentuk yang sama seperti endpoint daftar.

#### Scenario: Entitas ditemukan
- **WHEN** `GET /api/v1/entities/{id}` dipanggil dengan ID entitas yang ada
- **THEN** respons berstatus 200 dengan entitas tersebut pada `data` dan `meta` null

#### Scenario: Entitas tidak ditemukan
- **WHEN** `GET /api/v1/entities/{id}` dipanggil dengan UUID yang tidak ada
- **THEN** respons berstatus 404 dengan error berkode `not_found`

#### Scenario: ID tidak valid
- **WHEN** `GET /api/v1/entities/{id}` dipanggil dengan nilai yang bukan UUID
- **THEN** respons berstatus 400 dengan error berkode `invalid_id` dan `field` bernilai `id`

### Requirement: Marker membuka panel detail
Sistem SHALL membuka panel detail saat marker dipilih, dan menampilkan nama, jenis, status, deskripsi, atribut, koordinat, serta waktu dibuat dan diperbarui.

#### Scenario: Marker dipilih
- **WHEN** pengguna memilih marker
- **THEN** panel menampilkan seluruh informasi entitas tersebut

#### Scenario: Data opsional kosong
- **GIVEN** entitas tanpa deskripsi dan tanpa atribut
- **WHEN** panel ditampilkan
- **THEN** panel menyatakan bahwa keduanya tidak tersedia

#### Scenario: Marker lain dipilih
- **GIVEN** panel detail terbuka
- **WHEN** pengguna memilih marker lain
- **THEN** panel menampilkan entitas yang baru dipilih, tanpa menampilkan data entitas sebelumnya

### Requirement: Panel detail dapat ditutup
Sistem SHALL menutup panel saat pengguna memilih tombol tutup atau menekan `Esc`, menghilangkan keadaan terpilih, dan mengembalikan fokus ke marker pemicu.

#### Scenario: Ditutup dengan tombol
- **WHEN** pengguna memilih tombol tutup
- **THEN** panel tertutup dan marker tidak lagi tampil terpilih

#### Scenario: Ditutup dengan keyboard
- **WHEN** pengguna menekan `Esc` saat panel terbuka
- **THEN** panel tertutup dan fokus kembali ke marker pemicu

### Requirement: Panel menangani kegagalan
Sistem SHALL menampilkan pesan tidak ditemukan saat entitas sudah tidak ada, dan pesan error dengan tombol coba lagi saat pengambilan data gagal.

#### Scenario: Entitas sudah dihapus
- **WHEN** detail entitas terpilih membalas 404
- **THEN** panel menyatakan bahwa entitas tidak ditemukan

#### Scenario: Pengambilan gagal
- **WHEN** detail entitas gagal dimuat karena sebab lain
- **THEN** panel menampilkan pesan error dan tombol coba lagi yang mengambil ulang data

### Requirement: Isi entitas ditampilkan sebagai teks
Sistem SHALL menampilkan semua nilai entitas sebagai teks biasa.

#### Scenario: Nilai berisi HTML
- **GIVEN** nama, deskripsi, atau atribut entitas berisi HTML
- **WHEN** panel ditampilkan
- **THEN** nilai tersebut tampil apa adanya dan tidak dieksekusi
