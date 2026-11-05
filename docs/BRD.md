# BRD — Business Requirements Document

| | |
|---|---|
| **Proyek** | GeoEntity Manager (Take-Home Test Software Developer) |
| **Sumber kebutuhan** | PDF "Take-Home Test — Software Developer" |
| **Status** | Disetujui sebagai baseline pengerjaan |

## 1. Latar belakang

Perusahaan memiliki atau memantau objek dunia nyata yang tersebar secara geografis, seperti kendaraan, perangkat IoT, dan fasilitas. Operator perlu melihat posisi objek tersebut di peta dan menjaga datanya tetap benar.

Dokumen ini merumuskan kebutuhan dari soal tes. Hal yang tidak disebut soal dan ditambahkan oleh kandidat ditandai sebagai **asumsi**.

## 2. Tujuan bisnis

| ID | Tujuan | Ukuran keberhasilan |
|---|---|---|
| BO-1 | Operator melihat sebaran entitas secara visual | Semua entitas tersimpan tampil sebagai marker pada peta |
| BO-2 | Data entitas dapat dikelola tanpa akses langsung ke database | Tambah, ubah, hapus, dan lihat detail tersedia dari UI |
| BO-3 | Data yang tersimpan terjaga kualitasnya | Data tidak valid ditolak di frontend dan backend |
| BO-4 | Hasil kerja mudah dievaluasi | Reviewer dapat menjalankan aplikasi dengan panduan README |

## 3. Pemangku kepentingan

| Pihak | Kepentingan |
|---|---|
| Tim penilai PT Len | Menilai kualitas kode, dokumentasi, dan pemakaian Agentic AI |
| Kandidat | Menyelesaikan dan mengirim hasil sebelum deadline |
| Operator (persona fiktif) | Mengelola entitas lewat peta |

## 4. Ruang lingkup

**Termasuk**

- Aplikasi web dengan frontend React + TypeScript dan backend Go.
- Penyimpanan data persisten melalui backend.
- Pengelolaan entitas (CRUD) dan tampilan peta.
- Validasi di frontend dan backend.
- Dokumentasi dan bukti penggunaan Agentic AI.

**Tidak termasuk** (lihat juga [PRD §7](PRD.md#7-di-luar-ruang-lingkup))

- Autentikasi dan otorisasi pengguna. Ini **asumsi**, karena soal tidak memintanya.
- Pelacakan posisi real-time.
- Deployment ke production.

## 5. Kebutuhan bisnis dari soal

| ID | Kebutuhan | Sumber di soal |
|---|---|---|
| BR-1 | Entitas memiliki identitas, atribut dasar, status, dan koordinat geografis | Overview |
| BR-2 | Entitas dapat merepresentasikan berbagai jenis objek | Overview |
| BR-3 | Entitas ditampilkan pada peta | Functional Requirement |
| BR-4 | Entitas dapat ditambah, dihapus, dan diubah | Functional Requirement |
| BR-5 | Detail entitas dapat dilihat pada peta | Functional Requirement |
| BR-6 | Frontend dan backend memvalidasi input atau data | Functional Requirement |
| BR-7 | Data disimpan dan diambil melalui backend | Overview |
| BR-8 | Dokumentasi menjelaskan cara menjalankan program | Documentation |
| BR-9 | Dokumentasi menjelaskan alasan pemilihan library | Documentation |
| BR-10 | Dokumentasi menjelaskan workflow dan batas penggunaan Agentic AI | Documentation |
| BR-11 | Fitur yang belum selesai dijelaskan pada dokumentasi | Submission |
| BR-12 | `CLAUDE.md` atau `AGENT.md` tersedia di repository bila memakai Agentic AI | Submission |
| BR-13 | Hasil dikirim sebagai repository Git, paling lambat 2 hari setelah soal diterima | Submission |

## 6. Batasan dan asumsi

- **Waktu:** 2 hari sejak soal diterima. Lihat [PEP](PEP.md).
- **Stack wajib:** React + TypeScript dan Go. Pilihan lain bebas dan dicatat di [ITA](ITA.md).
- **Asumsi:** aplikasi dijalankan reviewer secara lokal dengan Docker, tanpa API key berbayar.
- **Asumsi:** satu instance aplikasi dipakai bersama tanpa konsep akun.
