# PRD — Product Requirements Document

## 1. Ringkasan produk

**GeoEntity Manager** adalah aplikasi web untuk menampilkan dan mengelola entitas berlokasi geografis di atas peta. Dokumen ini menerjemahkan [BRD](BRD.md) menjadi perilaku produk yang bisa diuji.

## 2. Persona

**Operator** memantau aset dan memperbarui datanya. Operator memakai laptop dan bekerja dari peta, bukan dari database.

## 3. Model entitas

| Field | Wajib | Keterangan |
|---|---|---|
| `id` | Dibuat sistem | UUID |
| `name` | Ya | Nama yang mudah dikenali |
| `type` | Ya | `vehicle`, `iot_device`, `facility`, atau `other` |
| `status` | Ya | `active`, `inactive`, atau `maintenance` |
| `description` | Tidak | Keterangan bebas |
| `attributes` | Tidak | Pasangan key-value tambahan, misalnya `plate_number` |
| `latitude` | Ya | Koordinat WGS84 |
| `longitude` | Ya | Koordinat WGS84 |
| `created_at`, `updated_at` | Dibuat sistem | Waktu UTC |

Aturan validasi rinci ada di [§5](#5-aturan-validasi).

## 4. Kebutuhan fungsional

Prioritas memakai MoSCoW: **M** = Must, **S** = Should.

| ID | Kebutuhan | Prioritas | BRD | User story |
|---|---|---|---|---|
| FR-1 | Aplikasi dapat dijalankan dan data tersimpan persisten | M | BR-7 | [US-001](user_stories/US-001.md) |
| FR-2 | Menampilkan semua entitas sebagai marker pada peta, dibedakan menurut jenis dan status | M | BR-1, BR-2, BR-3 | [US-002](user_stories/US-002.md) |
| FR-3 | Memilih marker untuk melihat detail entitas | M | BR-5 | [US-003](user_stories/US-003.md) |
| FR-4 | Menambah entitas dengan memilih titik pada peta dan mengisi form | M | BR-4 | [US-004](user_stories/US-004.md) |
| FR-5 | Mengubah data entitas, termasuk memindahkan lokasinya | M | BR-4 | [US-005](user_stories/US-005.md) |
| FR-6 | Menghapus entitas setelah konfirmasi | M | BR-4 | [US-006](user_stories/US-006.md) |
| FR-7 | Validasi input di frontend dan backend dengan pesan per field | M | BR-6 | [US-007](user_stories/US-007.md) |
| FR-8 | Memfilter entitas di peta menurut jenis dan status | S | BR-2 | [US-008](user_stories/US-008.md) |

## 5. Aturan validasi

Tabel ini adalah sumber tunggal aturan validasi. Skema Zod di frontend dan validator Go di backend harus mengikuti tabel yang sama.

| Field | Aturan | Kode error |
|---|---|---|
| `name` | Wajib; 1–100 karakter setelah spasi tepi dibuang | `required`, `too_long` |
| `type` | Wajib; salah satu nilai enum | `required`, `invalid_enum` |
| `status` | Wajib; salah satu nilai enum | `required`, `invalid_enum` |
| `description` | Opsional; maksimal 500 karakter | `too_long` |
| `attributes` | Opsional; objek berisi maksimal 20 pasangan | `too_many` |
| Key `attributes` | 1–50 karakter; huruf, angka, `_`, `.`, atau `-` | `invalid_format` |
| Value `attributes` | String; maksimal 200 karakter | `invalid_type`, `too_long` |
| `latitude` | Wajib; angka; -90 sampai 90 | `required`, `out_of_range` |
| `longitude` | Wajib; angka; -180 sampai 180 | `required`, `out_of_range` |

Koordinat `0,0` adalah nilai yang sah, sehingga validasi wajib harus membedakan `0` dari nilai kosong.

## 6. Kebutuhan non-fungsional

| ID | Kebutuhan |
|---|---|
| NFR-1 | Reviewer dapat menjalankan seluruh aplikasi dengan satu perintah `docker compose up --build` |
| NFR-2 | Tidak ada API key berbayar yang diperlukan |
| NFR-3 | Semua respons API memakai envelope yang konsisten ([API](API.md)) |
| NFR-4 | Query SQL memakai parameter; body request dibatasi ukurannya; CORS memakai allowlist |
| NFR-5 | Data dari pengguna tidak dirender sebagai HTML mentah |
| NFR-6 | Layout dapat dipakai pada lebar 1024 px ke atas dan tetap terbaca di layar ponsel |
| NFR-7 | Kontrol utama dapat diakses dengan keyboard dan memiliki label |
| NFR-8 | Peta menangani hingga 500 entitas tanpa macet pada laptop biasa |

## 7. Di luar ruang lingkup

Hal berikut sengaja tidak dikerjakan agar waktu terfokus pada kebutuhan soal.

| Hal | Alasan | Konsekuensi |
|---|---|---|
| Autentikasi dan otorisasi | Tidak diminta soal | API terbuka; tidak boleh dipublikasikan apa adanya |
| Pelacakan real-time | Tidak diminta soal | Peta diperbarui lewat refetch |
| Optimistic concurrency | Bukan kebutuhan soal | Pada update bersamaan, penulis terakhir yang menang |
| Idempotency key pada `POST` | Pengguna tunggal; tombol submit dinonaktifkan selama request berjalan | Retry manual bisa membuat duplikat |
| Rate limiting | Bukan kebutuhan soal | Perlu ditambahkan sebelum dipublikasikan |
| Clustering marker | Batas 500 entitas masih terkelola | Marker bisa bertumpuk pada area padat |
| Polygon dan geofence | Soal hanya menyebut koordinat | Hanya titik yang didukung |

## 8. Kriteria penerimaan produk

- Semua FR berprioritas **M** lulus sesuai user story masing-masing.
- Perubahan dari UI masih ada setelah aplikasi dan database di-restart.
- Payload tidak valid yang dikirim langsung ke API ditolak dengan HTTP 422.
- README menjelaskan cara menjalankan, alasan library, penggunaan Agentic AI, dan fitur yang belum selesai.
