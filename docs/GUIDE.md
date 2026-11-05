# Guide

> **Status:** aplikasi belum diimplementasikan. Panduan ini menggambarkan perilaku yang direncanakan dan harus diperiksa kembali setelah fitur selesai. Status terbaru ada di [README](../README.md#status).

## 1. Menjalankan aplikasi

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

Bila port sudah terpakai, ubah nilainya di `.env`.

## 2. Menggunakan aplikasi

### Melihat entitas

Buka aplikasi, lalu geser atau perbesar peta. Ikon marker menunjukkan jenis, dan warnanya menunjukkan status. Bila muncul peringatan terlalu banyak data, perbesar peta untuk mempersempit area.

### Melihat detail

Pilih marker. Panel samping menampilkan informasi lengkap. Tutup dengan tombol ✕ atau `Esc`.

### Menambah entitas

1. Pilih **Tambah**.
2. Klik lokasi pada peta, atau ketik latitude dan longitude.
3. Isi nama, jenis, dan status. Deskripsi dan atribut bersifat opsional.
4. Pilih **Simpan**.

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
