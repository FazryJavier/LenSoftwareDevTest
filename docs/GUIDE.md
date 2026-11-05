# Guide

> **Status:** semua perilaku pada §2 dan §3 sudah tersedia. Status terbaru ada di [README](../README.md#status).

## 1. Menjalankan aplikasi

### Dengan Docker

> Jalur ini terbukti oleh job `e2e` di CI pada Linux. Jalur ini belum dicoba di mesin pengembangan Windows, karena Docker Desktop gagal berjalan di sana.

Prasyarat: Docker dengan Docker Compose, serta koneksi internet untuk memuat tile peta.

```bash
cp .env.example .env
```

```bash
docker compose up --build
```

| Layanan | Alamat |
|---|---|
| Aplikasi | http://localhost:5173 |
| API | http://localhost:8080/api/v1 |
| Health check | http://localhost:8080/api/v1/health |

Untuk berhenti tanpa menghapus data:

```bash
docker compose down
```

Perintah `docker compose down -v` menghapus seluruh data database.

Bila port sudah terpakai, ubah nilainya di `.env`. Database memakai port 5433 di mesin host, agar tidak bentrok dengan PostgreSQL lokal.

Untuk mengisi data contoh:

```bash
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < backend/seed/seed.sql
```

Database `geoentity_test` hanya dibuat otomatis pada volume baru. Pada volume lama, buat secara manual:

```bash
docker compose exec db sh -c 'createdb -U "$POSTGRES_USER" geoentity_test'
```

### Tanpa Docker

Jalur ini sudah diuji di Windows dengan PostgreSQL 18 dan PostGIS 3.6. Prasyaratnya PostgreSQL dengan ekstensi PostGIS, Go 1.27, dan Node.js 24. Contoh perintah di bawah memakai PowerShell.

File `.env` di root hanya dibaca Docker Compose, dan nilai `DATABASE_URL` di dalamnya menunjuk ke service `db` milik Compose. Tanpa Docker, backend hanya membaca environment terminal dan Vite mencari `.env` di folder `frontend/`, sehingga perintah di bawah mengisi nilainya sendiri.

Jalankan sekali dari folder repository. `psql` akan meminta password superuser PostgreSQL:

```powershell
psql -h localhost -U postgres -v ON_ERROR_STOP=1 -f db/local/setup.sql
```

Dari folder repository, terminal pertama menjalankan backend:

```powershell
npm run dev:backend
```

Terminal kedua menjalankan frontend. Dependensi dipasang otomatis bila `frontend/node_modules` belum ada:

```powershell
npm run dev:frontend
```

Buka http://localhost:5173. Peta Indonesia tampil bila semuanya berjalan. Hentikan dengan `Ctrl+C` di masing-masing terminal.

Kedua perintah itu menjalankan `go run ./cmd/server` di `backend` dan `npm run dev` di `frontend`, dengan `DATABASE_URL` dan `VITE_MAP_STYLE_URL` lokal yang sudah terisi di [`scripts/dev.mjs`](../scripts/dev.mjs). File `.env` tidak dibaca dan tidak diperlukan. Variabel yang disetel di terminal lebih diutamakan, misalnya untuk memakai database dari Compose:

```powershell
$env:DATABASE_URL="postgres://geo:geo_local_only@localhost:5433/geoentity?sslmode=disable"
```

Bila backend memakai port selain 8080, setel `$env:HTTP_ADDR` di terminal backend dan `$env:API_PROXY_TARGET` di terminal frontend, misalnya `:8082` dan `http://localhost:8082`.

Data contoh diisi dengan perintah berikut. Password role `geo` adalah `geo_local_only`:

```powershell
psql -h localhost -U geo -d geoentity -f backend/seed/seed.sql
```

Test integrasi membutuhkan `TEST_DATABASE_URL`:

```powershell
$env:TEST_DATABASE_URL="postgres://geo:geo_local_only@localhost:5432/geoentity_test?sslmode=disable"
```

```powershell
cd backend; go test ./...
```

`npm run test:e2e` membutuhkan backend dan frontend yang sedang berjalan, serta browser dari `npx playwright install chromium`. Test ini membuat data berawalan `E2E `, lalu menghapus semua entitas berawalan itu setelah selesai, jadi jangan memakai awalan tersebut untuk data sendiri.

## 2. Menggunakan aplikasi

### Melihat entitas

Buka aplikasi, lalu geser atau perbesar peta. Peta awal memuat seluruh Indonesia. Ikon marker menunjukkan jenis, dan warnanya menunjukkan status. Marker yang berdekatan dapat bertumpuk, sehingga perbesar peta untuk memisahkannya. Bila muncul peringatan terlalu banyak data, perbesar peta untuk mempersempit area.

### Melihat detail

Pilih marker. Panel menampilkan informasi lengkap di sisi kanan, atau di bagian bawah pada layar ponsel. Tutup dengan tombol ✕ atau `Esc`.

### Menambah entitas

1. Pilih **Tambah**.
2. Klik lokasi pada peta, atau ketik latitude dan longitude.
3. Isi nama, jenis, dan status. Deskripsi dan atribut bersifat opsional.
4. Pilih **Simpan**.

Bila data tidak valid, pesan tampil pada field terkait dan isi form tidak hilang. Saat membatalkan form yang sudah terisi, atau menekan `Esc`, aplikasi meminta konfirmasi lebih dulu.

### Mengubah entitas

1. Pilih marker, lalu **Ubah**.
2. Ubah data yang diperlukan. Untuk memindahkan lokasi, klik peta, geser marker, atau ketik koordinat.
3. Pilih **Simpan**, atau **Batal** untuk membuang perubahan.

### Menghapus entitas

Pilih marker, **Hapus**, lalu konfirmasi. Penghapusan bersifat permanen.

### Memfilter

Pilih jenis atau status pada bagian atas. Filter tersimpan pada URL, sehingga dapat dibagikan. Pilih **Reset** untuk menghapus filter.

## 3. Memanggil API

Kontrak lengkap ada di [API](API.md).

```bash
curl -X POST http://localhost:8080/api/v1/entities -H "Content-Type: application/json" -d '{"name":"Sensor Gudang","type":"iot_device","status":"active","latitude":-6.2,"longitude":106.8}'
```

## 4. Mengatasi masalah

| Gejala | Kemungkinan penyebab | Tindakan |
|---|---|---|
| Peta kosong, marker tetap tampil | Layanan tile tidak terjangkau | Periksa internet atau ganti `VITE_MAP_STYLE_URL`, lalu build ulang |
| `port is already allocated` | Port sudah terpakai | Ubah port di `.env` |
| API membalas 503 | Database belum siap | Tunggu sebentar, lalu periksa `docker compose logs db` |
| Peta tidak muncul sama sekali | WebGL nonaktif di browser | Aktifkan akselerasi hardware atau ganti browser |
| Backend berhenti dengan `DATABASE_URL is required` | Variabel belum disetel di terminal itu | Setel `$env:DATABASE_URL`, lalu jalankan lagi |
| Halaman kosong dengan `Invalid environment variables` di console | `VITE_MAP_STYLE_URL` belum disetel | Setel `$env:VITE_MAP_STYLE_URL`, lalu jalankan lagi `npm run dev` |
