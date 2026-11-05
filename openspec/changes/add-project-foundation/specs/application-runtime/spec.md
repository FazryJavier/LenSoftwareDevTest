# Spec Delta

## Purpose

Menjamin aplikasi dapat dijalankan dengan satu perintah, memasang skema databasenya sendiri, menyimpan data secara persisten, dan melaporkan kesehatannya melalui API.

## ADDED Requirements

### Requirement: Aplikasi berjalan dengan satu perintah
Sistem SHALL menjalankan database, backend, dan frontend dengan `docker compose up --build`, memakai salinan `.env.example` sebagai `.env` tanpa API key atau konfigurasi tambahan.

#### Scenario: Semua layanan berjalan
- **GIVEN** salinan `.env.example` sebagai `.env`
- **WHEN** `docker compose up --build` dijalankan
- **THEN** database, backend, dan frontend berstatus sehat

#### Scenario: Frontend terhubung ke backend
- **GIVEN** semua layanan berjalan
- **WHEN** pengguna membuka frontend di browser
- **THEN** halaman menampilkan bahwa backend terhubung

### Requirement: Endpoint kesehatan melaporkan kondisi layanan
Sistem SHALL menyediakan `GET /api/v1/health` yang melaporkan apakah backend dapat menjangkau database, memakai envelope standar dan tanpa membocorkan detail internal.

#### Scenario: Layanan sehat
- **WHEN** `GET /api/v1/health` dipanggil dan database dapat dijangkau
- **THEN** respons berstatus 200 dengan `code` 200, `success` true, `data` null, `errors` null, dan `meta` null

#### Scenario: Database tidak dapat dijangkau
- **WHEN** `GET /api/v1/health` dipanggil dan database tidak dapat dijangkau
- **THEN** respons berstatus 503 dengan `success` false dan satu error berkode `unavailable`
- **AND** respons tidak memuat alamat database, SQL, atau pesan error driver

### Requirement: Rute yang tidak tersedia memakai envelope standar
Sistem SHALL membalas rute atau method yang tidak tersedia dengan envelope standar dan kode status yang sesuai.

#### Scenario: Rute tidak ditemukan
- **WHEN** path yang tidak terdaftar dipanggil
- **THEN** respons berstatus 404 dengan error berkode `not_found`

#### Scenario: Method tidak didukung
- **WHEN** `POST /api/v1/health` dipanggil
- **THEN** respons berstatus 405 dengan error berkode `method_not_allowed` dan header `Allow`

### Requirement: Setiap respons dapat ditelusuri
Sistem SHALL menyertakan header `X-Request-ID` pada setiap respons, memakai satu nilai yang sama dengan catatan log request tersebut.

#### Scenario: Request ID tersedia
- **WHEN** endpoint apa pun dipanggil
- **THEN** respons memuat header `X-Request-ID` yang tidak kosong

### Requirement: Kegagalan internal tidak membocorkan detail
Sistem SHALL mengubah panic saat menangani request menjadi respons 500 berenvelope, tanpa stack trace, dan tetap melayani request berikutnya.

#### Scenario: Handler mengalami panic
- **WHEN** handler mengalami panic
- **THEN** respons berstatus 500 dengan error berkode `internal_error`
- **AND** respons tidak memuat stack trace

### Requirement: Skema database terpasang otomatis
Sistem SHALL memasang semua migrasi yang belum berjalan saat backend start, dan SHALL berhenti dengan status gagal bila migrasi tidak berhasil.

#### Scenario: Database kosong
- **GIVEN** database baru tanpa tabel aplikasi
- **WHEN** backend start
- **THEN** tabel `entities` beserta indeks spasialnya tersedia

#### Scenario: Migrasi sudah terpasang
- **GIVEN** migrasi sudah pernah berjalan
- **WHEN** backend start kembali
- **THEN** backend berjalan normal tanpa mengubah data yang ada

### Requirement: Data bertahan setelah restart
Sistem SHALL menyimpan data database pada volume persisten sehingga data tetap ada setelah container dihentikan dan dijalankan kembali.

#### Scenario: Container di-restart
- **GIVEN** data sudah tersimpan
- **WHEN** layanan dihentikan dengan `docker compose down` lalu dijalankan kembali
- **THEN** data yang sama masih tersedia

### Requirement: Konfigurasi tidak valid menghentikan aplikasi
Sistem SHALL berhenti saat start dan melaporkan semua variabel yang bermasalah bila konfigurasi wajib tidak valid, tanpa menuliskan nilai rahasianya ke log.

#### Scenario: Variabel wajib kosong
- **WHEN** backend start tanpa `DATABASE_URL`
- **THEN** backend berhenti dengan status gagal dan menyebut `DATABASE_URL` pada pesannya

#### Scenario: CORS wildcard ditolak
- **WHEN** backend start dengan `CORS_ALLOWED_ORIGINS` berisi `*`
- **THEN** backend berhenti dengan status gagal dan menyebut `CORS_ALLOWED_ORIGINS` pada pesannya

### Requirement: Origin lintas domain dibatasi
Sistem SHALL hanya mengizinkan akses lintas origin dari daftar `CORS_ALLOWED_ORIGINS`.

#### Scenario: Origin diizinkan
- **WHEN** request datang dari origin yang terdaftar
- **THEN** respons memuat header `Access-Control-Allow-Origin` dengan origin tersebut

#### Scenario: Origin tidak diizinkan
- **WHEN** request datang dari origin yang tidak terdaftar
- **THEN** respons tidak memuat header `Access-Control-Allow-Origin`

### Requirement: Pemeriksaan kualitas lulus di CI
Sistem SHALL lulus pemeriksaan format, lint, typecheck, test, keamanan dependensi, dan build pada backend dan frontend di CI.

#### Scenario: Pull Request dibuka
- **WHEN** CI berjalan pada Pull Request untuk change ini
- **THEN** job `backend`, `frontend`, `e2e`, dan `ci-success` lulus
