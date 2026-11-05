# entity-map-view Specification

## Purpose
Menampilkan entitas tersimpan pada peta menurut area yang sedang terlihat, agar operator mengetahui sebaran dan kondisi entitas sekilas.

## Requirements

### Requirement: API mengembalikan daftar entitas
Sistem SHALL menyediakan `GET /api/v1/entities` yang mengembalikan entitas pada `data` dan informasi pagination pada `meta`, dengan urutan `created_at` menurun lalu `id` menurun.

#### Scenario: Daftar berisi data
- **WHEN** `GET /api/v1/entities` dipanggil dan terdapat entitas tersimpan
- **THEN** respons berstatus 200 dengan array entitas pada `data`
- **AND** setiap entitas memuat `id`, `name`, `type`, `status`, `description`, `attributes`, `latitude`, `longitude`, `created_at`, dan `updated_at`
- **AND** `meta` memuat `page`, `per_page`, `total`, dan `total_pages`

#### Scenario: Tidak ada data
- **WHEN** `GET /api/v1/entities` dipanggil dan tidak ada entitas yang cocok
- **THEN** respons berstatus 200 dengan `data` berupa array kosong dan `meta.total` bernilai 0

#### Scenario: Koordinat tidak tertukar
- **GIVEN** entitas tersimpan pada latitude -6.9175 dan longitude 107.6191
- **WHEN** daftar diambil
- **THEN** entitas memiliki `latitude` -6.9175 dan `longitude` 107.6191

### Requirement: API memfilter menurut area
Sistem SHALL membatasi hasil pada area `bbox` berformat `minLng,minLat,maxLng,maxLat` bila parameter itu dikirim.

#### Scenario: Entitas di luar area
- **GIVEN** satu entitas di dalam area dan satu entitas di luar area
- **WHEN** `GET /api/v1/entities` dipanggil dengan `bbox` area tersebut
- **THEN** hanya entitas di dalam area yang dikembalikan, dan `meta.total` menghitung entitas di dalam area saja

#### Scenario: Entitas tepat di batas area
- **GIVEN** entitas tepat pada sudut `bbox`
- **WHEN** daftar diambil dengan `bbox` tersebut
- **THEN** entitas itu termasuk dalam hasil

### Requirement: API menolak parameter daftar yang tidak valid
Sistem SHALL membalas 400 dengan error berkode `invalid_query` dan `field` berisi nama parameter, bila `bbox`, `page`, atau `per_page` tidak valid.

#### Scenario: Bbox tidak valid
- **WHEN** `bbox` tidak berisi empat angka, keluar dari rentang koordinat, atau nilai minimumnya tidak lebih kecil dari maksimum
- **THEN** respons berstatus 400 dengan `errors[0].field` bernilai `bbox`

#### Scenario: Pagination tidak valid
- **WHEN** `page` kurang dari 1, atau `per_page` di luar rentang 1 sampai 500, atau keduanya bukan bilangan bulat
- **THEN** respons berstatus 400 dengan `errors[0].field` berisi nama parameter tersebut

#### Scenario: Pagination di batas
- **WHEN** `per_page` bernilai 1 atau 500
- **THEN** respons berstatus 200

### Requirement: Peta menampilkan marker entitas
Sistem SHALL menampilkan setiap entitas pada area yang terlihat sebagai marker pada koordinatnya.

#### Scenario: Peta dimuat
- **GIVEN** entitas tersimpan di area yang terlihat
- **WHEN** peta selesai dimuat
- **THEN** setiap entitas tampil sebagai marker

### Requirement: Marker membedakan jenis dan status
Sistem SHALL menunjukkan jenis melalui ikon dan status melalui warna, serta menyebut nama, jenis, dan status pada label aksesibilitas marker.

#### Scenario: Marker dapat dibaca tanpa warna
- **WHEN** marker tampil untuk entitas `vehicle` berstatus `active`
- **THEN** marker memakai ikon kendaraan dan warna status aktif
- **AND** label aksesibilitasnya memuat nama entitas, "Kendaraan", dan "Aktif"

### Requirement: Peta memuat ulang data saat digeser
Sistem SHALL mengambil ulang data untuk area yang terlihat setelah pergerakan peta selesai, tanpa menghilangkan marker lama sampai data baru tiba.

#### Scenario: Peta digeser
- **WHEN** peta selesai digeser atau diperbesar
- **THEN** daftar dimuat ulang dengan `bbox` area yang terlihat

### Requirement: Peta memberi tahu bila data terlalu banyak
Sistem SHALL memberi tahu pengguna untuk memperbesar peta bila jumlah entitas pada area melebihi jumlah yang dimuat.

#### Scenario: Data melebihi batas
- **WHEN** `meta.total` lebih besar dari jumlah entitas yang diterima
- **THEN** peringatan untuk memperbesar peta tampil

### Requirement: Peta menangani keadaan kosong dan gagal
Sistem SHALL menampilkan pesan kosong saat tidak ada entitas, dan pesan error dengan tombol coba lagi saat API gagal.

#### Scenario: Belum ada entitas
- **WHEN** daftar kosong
- **THEN** pesan bahwa belum ada entitas pada area ini tampil, dan peta tetap dapat dipakai

#### Scenario: API gagal
- **WHEN** pengambilan daftar gagal
- **THEN** pesan error dan tombol coba lagi tampil, dan menekan tombol itu mengambil ulang data

#### Scenario: Peta dasar gagal dimuat
- **WHEN** style atau tile peta gagal dimuat
- **THEN** marker dan pesan aplikasi tetap dapat dipakai

### Requirement: Marker terpilih dapat dibedakan
Sistem SHALL menampilkan marker entitas terpilih secara berbeda dari marker lain, dan menandainya bagi pembaca layar.

#### Scenario: Marker dipilih
- **WHEN** pengguna memilih marker
- **THEN** marker itu tampil lebih besar dengan cincin warna utama, dan memiliki `aria-pressed` bernilai true
