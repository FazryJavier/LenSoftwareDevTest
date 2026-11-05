# GeoEntity Manager

Aplikasi web untuk menampilkan dan mengelola entitas berlokasi geografis, seperti kendaraan, perangkat IoT, dan fasilitas, di atas peta. Proyek ini dibuat untuk Take-Home Test Software Developer.

**Stack:** React + TypeScript, Go, PostgreSQL + PostGIS, dan MapLibre.

## Status

> Saat ini baru fondasi dokumen, OpenSpec, dan CI yang tersedia. **Kode aplikasi belum dibuat, sehingga perintah pada bagian "Cara menjalankan" belum bisa dipakai.**

| Fitur | User story | Status |
|---|---|---|
| Fondasi aplikasi | [US-001](docs/user_stories/US-001.md) | Belum mulai |
| Menampilkan entitas pada peta | [US-002](docs/user_stories/US-002.md) | Belum mulai |
| Melihat detail entitas | [US-003](docs/user_stories/US-003.md) | Belum mulai |
| Menambah entitas | [US-004](docs/user_stories/US-004.md) | Belum mulai |
| Mengubah entitas | [US-005](docs/user_stories/US-005.md) | Belum mulai |
| Menghapus entitas | [US-006](docs/user_stories/US-006.md) | Belum mulai |
| Validasi frontend dan backend | [US-007](docs/user_stories/US-007.md) | Belum mulai |
| Filter jenis dan status | [US-008](docs/user_stories/US-008.md) | Belum mulai |

Batasan yang disengaja, seperti tidak adanya autentikasi, tercatat di [PRD §7](docs/PRD.md#7-di-luar-ruang-lingkup).

## Cara menjalankan

Prasyarat: Docker dengan Docker Compose.

```bash
cp .env.example .env
```

```bash
docker compose up --build
```

Aplikasi direncanakan tersedia di http://localhost:5173. Panduan lengkap ada di [GUIDE](docs/GUIDE.md).

## Alasan pemilihan library

Ringkasan berikut dijelaskan lebih lengkap, beserta alternatifnya, di [ITA](docs/ITA.md).

| Pilihan | Alasan utama |
|---|---|
| MapLibre + OpenFreeMap | Tidak butuh API key, sehingga mudah dijalankan penilai |
| PostgreSQL + PostGIS | Tipe data dan indeks spasial untuk memuat entitas di area peta |
| `net/http` + pgx | Sudah cukup untuk enam endpoint, dengan dependensi sedikit |
| TanStack Query | Hampir semua state berasal dari server |
| React Hook Form + Zod | Validasi form dengan tipe TypeScript dari satu skema |
| Tailwind CSS | Styling cepat dan konsisten dengan token desain |

## Penggunaan Agentic AI

Proyek ini dikerjakan dengan **Claude Code** dan **OpenSpec**. Rincian alat, batas peran, dan log pekerjaan ada di [AI_USAGE](docs/AI_USAGE.md). Alur kerjanya ada di [WORKFLOW](docs/WORKFLOW.md).

Konfigurasi AI sengaja di-commit agar dapat diperiksa: [`CLAUDE.md`](CLAUDE.md), `.claude/`, dan `openspec/`.

## Dokumentasi

Daftar lengkap ada di [docs/README.md](docs/README.md). Riwayat perubahan setiap fitur ada di [CHANGELOG](CHANGELOG.md).
