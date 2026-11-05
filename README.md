# GeoEntity Manager

Aplikasi web untuk menampilkan dan mengelola entitas berlokasi geografis, seperti kendaraan, perangkat IoT, dan fasilitas, di atas peta. Proyek ini dibuat untuk Take-Home Test Software Developer PT Len Innovation Technology.

**Stack:** React + TypeScript, Go, PostgreSQL + PostGIS, dan MapLibre.

**Isi README:** [Pemenuhan soal](#pemenuhan-soal) · [Status](#status) · [Cara menjalankan](#cara-menjalankan) · [Alasan pemilihan library](#alasan-pemilihan-library) · [Penggunaan Agentic AI](#penggunaan-agentic-ai) · [Struktur repository](#struktur-repository) · [Dokumentasi lain](#dokumentasi-lain)

## Pemenuhan soal

Setiap poin pada PDF soal dan tempat menjawabnya:

### Aplikasi dan data

| Permintaan soal | Jawaban | Status |
|---|---|---|
| Frontend React + TypeScript | Folder [`frontend/`](frontend/) | Terpenuhi |
| Backend Go | Folder [`backend/`](backend/) | Terpenuhi |
| Data disimpan dan diambil melalui backend | REST API di `/api/v1`, disimpan di PostgreSQL. Lihat [API](docs/API.md) | Terpenuhi |
| Entitas memiliki identitas, atribut dasar, status, dan koordinat | `id`, `name`, `type`, `status`, `description`, `attributes`, `latitude`, `longitude`. Lihat [PRD §3](docs/PRD.md#3-model-entitas) | Terpenuhi |

### Kebutuhan fungsional

| Permintaan soal | Cara memakainya | User story dan PR |
|---|---|---|
| Menampilkan entitas ke dalam map | Marker tampil sesuai area peta. Ikon menunjukkan jenis, dan warna menunjukkan status | [US-002](docs/user_stories/US-002.md), [PR #4](https://github.com/FazryJavier/LenSoftwareDevTest/pull/4) |
| Menambah entitas | **Tambah**, lalu klik peta atau ketik koordinat, isi form, dan **Simpan** | [US-004](docs/user_stories/US-004.md), [PR #6](https://github.com/FazryJavier/LenSoftwareDevTest/pull/6) |
| Mengubah entitas | Pilih marker, **Ubah**, lalu ubah data atau pindahkan lokasinya | [US-005](docs/user_stories/US-005.md), [PR #7](https://github.com/FazryJavier/LenSoftwareDevTest/pull/7) |
| Menghapus entitas | Pilih marker, **Hapus**, lalu konfirmasi | [US-006](docs/user_stories/US-006.md), [PR #8](https://github.com/FazryJavier/LenSoftwareDevTest/pull/8) |
| Melihat detail entitas pada map | Pilih marker, lalu panel menampilkan datanya | [US-003](docs/user_stories/US-003.md), [PR #5](https://github.com/FazryJavier/LenSoftwareDevTest/pull/5) |
| Validasi di backend dan frontend | Aturan yang sama diuji di kedua sisi lewat [`testdata/validation-cases.json`](testdata/validation-cases.json). Aturannya ada di [PRD §5](docs/PRD.md#5-aturan-validasi) | [US-007](docs/user_stories/US-007.md), [PR #9](https://github.com/FazryJavier/LenSoftwareDevTest/pull/9) |

Tambahan di luar permintaan soal: filter jenis dan status ([US-008](docs/user_stories/US-008.md), [PR #10](https://github.com/FazryJavier/LenSoftwareDevTest/pull/10)).

### Dokumentasi dan pengiriman

| Permintaan soal | Jawaban |
|---|---|
| Menjelaskan cara menjalankan program | [Cara menjalankan](#cara-menjalankan) |
| Menjelaskan alasan pemilihan library | [Alasan pemilihan library](#alasan-pemilihan-library) |
| Menjelaskan workflow dan sejauh mana Agentic AI dipakai | [Penggunaan Agentic AI](#penggunaan-agentic-ai) |
| Menjelaskan fitur yang belum selesai | [Yang belum selesai](#yang-belum-selesai) |
| Menyertakan `AGENT.md` atau `CLAUDE.md` | [`CLAUDE.md`](CLAUDE.md) di root repository |
| Mengirim repository Git | [FazryJavier/LenSoftwareDevTest](https://github.com/FazryJavier/LenSoftwareDevTest), repository publik |
| Mengirim lewat email sebelum tenggat | Dilakukan oleh kandidat, di luar repository ini |

### Hal yang dibebaskan soal

| Pilihan | Keputusan | Alasan rinci |
|---|---|---|
| Database | PostgreSQL + PostGIS | [ADR-002](docs/adr/ADR-002-postgresql-postgis.md) |
| API design | REST JSON dengan envelope seragam dan versi `/api/v1` | [API](docs/API.md), [openapi.yaml](docs/openapi.yaml) |
| State management | TanStack Query untuk data server, URL untuk filter, tanpa global store | [ADR-004](docs/adr/ADR-004-tanstack-query-state.md) |
| Map provider dan library | MapLibre GL JS + OpenFreeMap | [ADR-001](docs/adr/ADR-001-maplibre-openfreemap.md) |
| Styling | Tailwind CSS dengan token desain | [DESIGN_SYSTEM](docs/DESIGN_SYSTEM.md) |
| Library lain | Lihat tabel di bawah | [Alasan pemilihan library](#alasan-pemilihan-library) |

## Status

> Semua kebutuhan fungsional soal sudah dibuat dan lulus CI. Yang tersisa adalah pemeriksaan manual dengan Docker dan pengukuran performa, seperti dijelaskan pada [Yang belum selesai](#yang-belum-selesai).

| Fitur | User story | Status |
|---|---|---|
| Fondasi aplikasi | [US-001](docs/user_stories/US-001.md) | Sedang dikerjakan |
| Menampilkan entitas pada peta | [US-002](docs/user_stories/US-002.md) | Selesai |
| Melihat detail entitas | [US-003](docs/user_stories/US-003.md) | Selesai |
| Menambah entitas | [US-004](docs/user_stories/US-004.md) | Selesai |
| Mengubah entitas | [US-005](docs/user_stories/US-005.md) | Selesai |
| Menghapus entitas | [US-006](docs/user_stories/US-006.md) | Selesai |
| Validasi frontend dan backend | [US-007](docs/user_stories/US-007.md) | Selesai |
| Filter jenis dan status | [US-008](docs/user_stories/US-008.md) | Selesai |

### Yang belum selesai

| Hal | Keadaan sekarang | Dampak |
|---|---|---|
| Pemeriksaan manual Docker pada US-001 | CI di Linux membuktikan `docker compose up --build`, Playwright, dan uji kontrak API. Jalur ini belum dicoba di mesin pengembangan Windows, karena Docker Desktop gagal berjalan di sana | Empat pemeriksaan belum dilakukan: container berjalan sebagai non-root, API membalas 503 saat database mati, data bertahan setelah `docker compose down`, dan database baru dalam keadaan kosong |
| Performa pada 500 entitas ([NFR-8](docs/PRD.md#6-kebutuhan-non-fungsional)) | Belum diukur. Frontend memuat paling banyak 500 entitas per area, dan meminta pengguna memperbesar peta bila ada lebih banyak | Belum ada bukti peta tetap lancar pada jumlah itu |
| Body request di atas sekitar 1,1 MiB | Backend berhenti membaca. Lewat proxy Vite, hasilnya dapat berupa 502 atau koneksi terputus, bukan 413. Lewat nginx belum diukur | Form aplikasi tidak menghasilkan body sebesar itu |
| Area peta yang melintasi garis bujur 180° | `bbox` seperti ini belum didukung | Entitas di sekitar garis itu mungkin perlu dilihat dari satu sisi saja |

Hal yang sengaja tidak dikerjakan, seperti autentikasi, tercatat di [PRD §7](docs/PRD.md#7-di-luar-ruang-lingkup). Karena tidak ada autentikasi, aplikasi ini hanya untuk pemakaian lokal.

## Cara menjalankan

### Dengan Docker

Prasyarat: Docker dengan Docker Compose, serta internet untuk memuat tile peta.

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

Peta awalnya kosong. Data contoh diisi dengan perintah berikut:

```bash
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < backend/seed/seed.sql
```

### Tanpa Docker

Prasyarat: PostgreSQL dengan PostGIS, Go 1.27, dan Node.js 24.

Jalankan sekali dari root repository. `psql` akan meminta password superuser PostgreSQL:

```bash
psql -h localhost -U postgres -v ON_ERROR_STOP=1 -f db/local/setup.sql
```

Dari root repository, terminal pertama menjalankan backend:

```bash
npm run dev:backend
```

Terminal kedua menjalankan frontend. Dependensi dipasang otomatis bila belum ada:

```bash
npm run dev:frontend
```

Buka http://localhost:5173.

**File `.env` tidak diperlukan untuk jalur ini.** File itu hanya dibaca Docker Compose, dan `DATABASE_URL` di dalamnya menunjuk ke service `db` milik Compose. [`scripts/dev.mjs`](scripts/dev.mjs) mengisi nilai lokalnya sendiri, dan variabel yang disetel di terminal lebih diutamakan.

Cara mengisi data contoh, menjalankan test, dan mengatasi masalah ada di [GUIDE](docs/GUIDE.md).

## Alasan pemilihan library

Kriteria utamanya: penilai dapat menjalankan aplikasi tanpa API key, library sesuai kebutuhan soal, aktif dipelihara, dan mudah diuji. Alternatif yang ditolak dan hasil cek kompatibilitas ada di [ITA](docs/ITA.md).

### Backend

| Library | Fungsi | Alasan |
|---|---|---|
| `net/http` (standard library) | Router dan server HTTP | Sudah mendukung method dan path parameter, sehingga framework tidak diperlukan untuk enam endpoint |
| `log/slog` (standard library) | Log terstruktur | Tidak menambah dependensi |
| `jackc/pgx` v5 | Driver PostgreSQL dan connection pool | Aktif dipelihara, dan SQL tetap eksplisit untuk fungsi PostGIS |
| `pressly/goose` v3 | Migrasi database | Memakai file SQL biasa yang dapat di-embed ke binary |

Validasi backend ditulis sendiri, agar `field` dan `code` pada error langsung sesuai kontrak API.

### Frontend

| Library | Fungsi | Alasan |
|---|---|---|
| `react`, `react-dom` | UI | Diwajibkan soal |
| `maplibre-gl` | Peta | Open source, tanpa API key, dan rendering WebGL |
| `@vis.gl/react-maplibre` | Komponen React untuk MapLibre | Khusus MapLibre, tanpa peer dependency Mapbox |
| `@tanstack/react-query` | Data dari server | Menyediakan cache, refetch, dan invalidasi. Redux terlalu berat, karena hampir semua state berasal dari server |
| `react-hook-form` | State form | Performa baik dan terintegrasi dengan resolver |
| `zod` | Validasi form dan respons API | Satu skema sekaligus menjadi tipe TypeScript |
| `@hookform/resolvers` | Penghubung Zod dengan React Hook Form | Integrasi resmi keduanya |
| `lucide-react` | Ikon | Ikon SVG yang dapat di-tree-shake |

Tile peta berasal dari OpenFreeMap, karena gratis dan tanpa API key.

### Alat pengembangan

| Alat | Fungsi | Alasan |
|---|---|---|
| TypeScript | Bahasa frontend | Diwajibkan soal. Versi dikunci ke `~6.0.3` agar sesuai `typescript-eslint` |
| Vite, `@vitejs/plugin-react` | Build dan dev server | Cepat dengan konfigurasi sedikit. Next.js tidak diperlukan, karena SSR tidak dibutuhkan |
| Tailwind CSS, `@tailwindcss/vite` | Styling | Cepat dan konsisten dengan token desain |
| Vitest, Testing Library, jsdom | Test komponen dan hook | Satu konfigurasi dengan Vite |
| Playwright | Test end-to-end | Menguji alur nyata pada browser sungguhan |
| ESLint, `typescript-eslint`, `eslint-plugin-react-hooks`, `globals`, Prettier | Lint dan format frontend | Standar ekosistem |
| golangci-lint | Lint Go | Menggabungkan banyak linter |
| OpenSpec | Proposal dan task sebelum kode | Perilaku disepakati sebelum implementasi |
| Redocly CLI, Newman, Postman CLI | Lint dan uji kontrak API | Memeriksa kontrak terhadap server yang berjalan |
| GitHub Actions, gitleaks, govulncheck, `npm audit`, Dependabot | CI dan keamanan | Memeriksa ulang setiap perubahan secara otomatis |

## Penggunaan Agentic AI

Proyek ini dikerjakan dengan **Claude Code** sebagai agent dan **OpenSpec** sebagai kerangka spec-driven development.

### Sejauh mana AI dipakai

**Hampir semua dokumen, kode, test, dan konfigurasi CI ditulis oleh Claude Code.** Kandidat menentukan arah, mengambil keputusan, dan menyetujui proposal.

| Pekerjaan | Claude Code | Kandidat |
|---|---|---|
| Kebutuhan dan dokumen | Membaca soal dan menyusun draf | Menentukan daftar dokumen dan arah |
| Keputusan teknis | Mengusulkan dan mengecek kompatibilitas | Memutuskan, misalnya memakai PostGIS lokal saat Docker gagal |
| Proposal OpenSpec | Menulis | Menyetujui. US-006 sampai US-008 disetujui sekaligus |
| Kode dan test | Menulis dan menjalankan | Tinjauan baris kode oleh kandidat tidak tercatat |
| Commit, push, dan PR | Menjalankan atas permintaan kandidat | Meminta |
| Merge | Mengaktifkan auto-merge | Menetapkan bahwa PR masuk tanpa approval setelah CI lulus |
| Pengiriman hasil | Tidak melakukan | Menjalankan |

### Alur kerja

1. Satu user story dari `docs/user_stories/` dikerjakan pada satu branch.
2. Claude Code menulis proposal, design, spec, dan task di `openspec/changes/`.
3. Setelah proposal disetujui, Claude Code menulis kode dan test, lalu menjalankan pemeriksaan lokal.
4. Perilaku diperiksa di browser sungguhan bila ada perubahan UI.
5. `CHANGELOG.md`, status, dan `docs/AI_USAGE.md` diperbarui.
6. Pull Request masuk ke `main` hanya bila CI lulus. Change OpenSpec kemudian diarsipkan.

Rincian alurnya ada di [WORKFLOW](docs/WORKFLOW.md).

### Kendali dan bukti

| Kendali | Tempat |
|---|---|
| Aturan proyek dan batas tindakan berisiko | [`CLAUDE.md`](CLAUDE.md) |
| Pemblokiran perintah destruktif dan pembacaan `.env` | [`.claude/settings.json`](.claude/settings.json) |
| Proposal dan task setiap fitur | [`openspec/changes/archive/`](openspec/changes/archive/) |
| Pemeriksaan ulang yang independen dari AI | [`ci.yml`](.github/workflows/ci.yml) |
| Log pekerjaan, peran kandidat, dan verifikasi | [AI_USAGE](docs/AI_USAGE.md) |
| Riwayat setiap perubahan | [CHANGELOG](CHANGELOG.md) |

### Kesalahan AI

AI tidak selalu benar, sehingga kesalahannya dicatat di [AI_USAGE](docs/AI_USAGE.md#kesalahan-ai). Contohnya:

- Claude menyatakan peta berfungsi berdasarkan pengujian dev server, padahal build produksi tidak berisi file worker MapLibre. CI yang menemukannya.
- Claude menghentikan `npm run dev` milik kandidat karena filter proses terlalu longgar.
- Claude salah menduga penyebab 502 pada body besar. Pengukuran setelah perubahan pertama justru lebih buruk, lalu akar masalahnya ditemukan.

## Struktur repository

Test berada di samping kodenya, sehingga tidak ditulis satu per satu di bawah. File `*_test.go` adalah test Go, dan `*.test.ts` atau `*.test.tsx` adalah test Vitest.

### Root

```text
.
├── backend/              # API Go
├── frontend/             # Aplikasi React + TypeScript
├── db/                   # Script persiapan database
├── docs/                 # Dokumen proyek
├── openspec/             # Spesifikasi perilaku dan riwayat change
├── postman/              # Uji kontrak API
├── scripts/
│   └── dev.mjs           # Menjalankan backend atau frontend tanpa Docker, dengan env lokal terisi
├── testdata/             # Data test yang dipakai backend dan frontend
├── .claude/              # Pengaturan, skill, dan command Claude Code
├── .github/              # CI, autofix, Dependabot, dan template PR
├── docker-compose.yml    # Menjalankan database, backend, dan frontend sekaligus
├── package.json          # Perintah dev:backend dan dev:frontend
├── .env.example          # Contoh nilai environment; disalin menjadi .env untuk Compose
├── .gitignore            # File yang tidak masuk Git
├── .gitattributes        # Memaksa akhir baris LF dan menandai file biner
├── CLAUDE.md             # Aturan untuk agent AI; file yang diminta soal
├── RTK.md                # Catatan alat peringkas output di mesin pengembang; tidak diperlukan untuk menjalankan aplikasi
├── CHANGELOG.md          # Riwayat perubahan setiap fitur
└── README.md             # Dokumen ini
```

### Backend

Kode dibagi menurut tanggung jawab: `httpapi` mengurus HTTP, `store` mengurus SQL, dan `domain` berisi aturan bisnis tanpa ketergantungan pada keduanya.

```text
backend/
├── cmd/server/
│   └── main.go                # Titik masuk: merangkai dependensi, migrasi, dan server
├── internal/
│   ├── config/
│   │   └── config.go          # Membaca dan memeriksa environment
│   ├── domain/                # Aturan bisnis, hanya memakai standard library
│   │   ├── entity.go          # Tipe Entity, EntityInput, enum, dan ListFilter
│   │   ├── validate.go        # Aturan validasi PRD §5
│   │   └── errors.go          # Error domain, misalnya ErrNotFound
│   ├── httpapi/               # Lapisan HTTP
│   │   ├── router.go          # Daftar rute, urutan middleware, dan interface EntityStore
│   │   ├── middleware.go      # Request ID, log, recover, security headers, dan CORS
│   │   ├── envelope.go        # Penulis respons berformat envelope
│   │   ├── decode.go          # Parsing query, termasuk filter, bbox, dan pagination
│   │   ├── decode_body.go     # Decode JSON dan batas ukuran body
│   │   ├── dto.go             # Bentuk JSON request dan response
│   │   ├── entity_handler.go  # Handler CRUD entitas
│   │   └── health_handler.go  # Handler pemeriksaan kesehatan
│   └── store/                 # Lapisan database
│       ├── db.go              # Connection pool dan migrasi
│       └── entity_store.go    # Semua query tabel entities
├── migrations/
│   ├── embed.go               # Menyertakan file SQL ke dalam binary
│   ├── 00001_create_entities.sql              # Membuat tabel entities dan indeks
│   └── 00002_use_geometry_location_index.sql  # Mengganti indeks lokasi agar cocok untuk query area
├── seed/
│   └── seed.sql               # Enam entitas contoh; dijalankan manual
├── Dockerfile                 # Build image backend
├── .dockerignore              # File yang tidak ikut ke image
├── .golangci.yml              # Aturan lint Go
├── go.mod                     # Daftar dependensi Go
└── go.sum                     # Checksum dependensi Go
```

### Frontend

```text
frontend/
├── src/
│   ├── main.tsx               # Root React dan QueryClientProvider
│   ├── App.tsx                # Komponen teratas aplikasi
│   ├── index.css              # Tailwind dan token desain
│   ├── api/                   # Komunikasi HTTP
│   │   ├── client.ts          # Satu-satunya pemanggil fetch; membongkar envelope
│   │   └── errors.ts          # Kelas ApiError
│   ├── lib/
│   │   └── env.ts             # Membaca dan memeriksa environment frontend
│   ├── components/ui/         # Komponen dasar tanpa logika entitas
│   │   ├── Button.tsx         # Tombol
│   │   ├── Field.tsx          # Label, pesan error, TextInput, TextArea, dan Select
│   │   ├── Dialog.tsx         # Dialog konfirmasi
│   │   ├── Toast.tsx          # Pesan singkat
│   │   └── Banner.tsx         # Pesan di atas peta
│   ├── features/entities/     # Semua fitur entitas
│   │   ├── EntitiesPage.tsx   # Halaman utama yang menyusun peta, panel, dan filter
│   │   ├── api.ts             # Fungsi pemanggil endpoint entitas
│   │   ├── schema.ts          # Skema Zod respons API
│   │   ├── hooks.ts           # Hook TanStack Query dan query key
│   │   ├── formSchema.ts      # Skema Zod form dan pembentuk payload API
│   │   ├── formErrors.ts      # Mengubah error API menjadi pesan form
│   │   ├── usePanel.ts        # Mode panel dan pengembalian fokus
│   │   ├── useEntityFilters.ts  # Menyimpan filter pada URL
│   │   ├── bbox.ts            # Mengubah batas peta menjadi parameter API
│   │   ├── format.ts          # Format tanggal dan koordinat
│   │   ├── constants.ts       # Label dan ikon per jenis dan status
│   │   ├── components/        # Bagian tampilan fitur
│   │   │   ├── Panel.tsx               # Bingkai panel di atas peta
│   │   │   ├── EntityDetailPanel.tsx   # Panel detail entitas
│   │   │   ├── EntityForm.tsx          # Form tambah dan ubah
│   │   │   ├── AttributeFields.tsx     # Input pasangan atribut
│   │   │   ├── EntityFilters.tsx       # Kontrol filter dan Reset
│   │   │   └── DeleteEntityDialog.tsx  # Konfirmasi hapus
│   │   └── map/               # Satu-satunya tempat yang memakai MapLibre
│   │       ├── EntityMap.tsx  # Peta dan pemuatan worker
│   │       └── EntityMarker.tsx  # Marker satu entitas
│   └── test/
│       └── setup.ts           # Persiapan Vitest
├── e2e/
│   └── map.spec.ts            # Test Playwright pada browser sungguhan
├── index.html                 # Halaman HTML awal
├── vite.config.ts             # Konfigurasi Vite, proxy API, dan Vitest
├── playwright.config.ts       # Konfigurasi Playwright
├── tsconfig.json              # Konfigurasi TypeScript
├── eslint.config.js           # Aturan lint
├── .prettierrc.json           # Aturan format
├── .prettierignore            # File yang tidak diformat
├── nginx.conf                 # Menyajikan aplikasi, meneruskan /api/, dan mengatur CSP pada Compose
├── Dockerfile                 # Build image frontend
├── .dockerignore              # File yang tidak ikut ke image
├── package.json               # Dependensi dan perintah npm
└── package-lock.json          # Versi dependensi yang dikunci
```

### Database, test bersama, dan API

```text
db/
├── init/
│   └── 01-create-test-db.sql  # Membuat geoentity_test saat volume Compose baru dibuat
└── local/
    └── setup.sql              # Membuat role, database, dan PostGIS tanpa Docker

testdata/
└── validation-cases.json      # Kasus validasi yang dijalankan test Go dan Vitest

postman/
└── geoentity.postman_collection.json  # Uji alur CRUD dan kegagalan terhadap server yang berjalan
```

### Dokumen

```text
docs/
├── README.md             # Daftar dokumen dan urutan baca
├── BRD.md                # Kebutuhan bisnis dari soal
├── PRD.md                # Kebutuhan produk, aturan validasi, dan ruang lingkup
├── PEP.md                # Rencana pengerjaan, risiko, dan Definition of Done
├── ITA.md                # Pilihan teknologi, alasan, dan hasil cek kompatibilitas
├── ARCHITECTURE.md       # Struktur sistem, alur data, pengujian, dan keamanan
├── DATABASE.md           # Skema, migrasi, dan pola query
├── ERD.md                # Diagram database
├── API.md                # Ringkasan kontrak API
├── openapi.yaml          # Kontrak API formal
├── DESIGN_SYSTEM.md      # Token, komponen, dan aksesibilitas
├── PROTOTYPE.md          # Wireframe dan alur layar
├── GUIDE.md              # Panduan menjalankan dan memakai aplikasi
├── WORKFLOW.md           # Alur kerja, OpenSpec, CI, dan autofix
├── AI_USAGE.md           # Log penggunaan dan kesalahan AI
├── adr/                  # Catatan keputusan arsitektur
│   ├── ADR-001-maplibre-openfreemap.md  # Pilihan peta
│   ├── ADR-002-postgresql-postgis.md    # Pilihan database
│   ├── ADR-003-stdlib-http-pgx.md       # Tanpa framework HTTP dan ORM
│   └── ADR-004-tanstack-query-state.md  # Pilihan state management
├── issue/                # Catatan masalah selama pengembangan
│   ├── README.md         # Daftar issue
│   └── TEMPLATE.md       # Template issue
└── user_stories/         # Satu file per fitur, beserta kriteria penerimaannya
    ├── README.md         # Daftar user story dan statusnya
    └── US-001.md ... US-008.md
```

### Alat AI dan otomatisasi

```text
.claude/
├── settings.json         # Memblokir perintah destruktif dan pembacaan .env
├── skills/               # Skill OpenSpec untuk Claude Code
└── commands/opsx/        # Command /opsx:propose, /opsx:apply, dan lainnya

openspec/
├── config.yaml           # Konfigurasi OpenSpec
├── specs/                # Perilaku terkini per kemampuan
│   └── .gitkeep          # Menjaga folder tetap ada di Git
└── changes/
    ├── add-project-foundation/  # Change US-001 yang masih terbuka
    └── archive/          # Change yang selesai, beserta proposal dan task-nya

.github/
├── workflows/
│   ├── ci.yml            # Lint, test, keamanan, dan end-to-end pada setiap PR
│   └── autofix.yml       # Perbaikan format otomatis pada PR
├── dependabot.yml        # Pembaruan dependensi otomatis
└── pull_request_template.md  # Template deskripsi PR
```

## Dokumentasi lain

Daftar lengkap ada di [docs/README.md](docs/README.md). Urutan baca yang disarankan untuk penilai: README ini → [AI_USAGE](docs/AI_USAGE.md) → [ARCHITECTURE](docs/ARCHITECTURE.md) → [ITA](docs/ITA.md).
