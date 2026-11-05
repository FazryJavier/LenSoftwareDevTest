# ITA — Implementation & Technology Assessment

Dokumen ini menjelaskan teknologi yang dipilih, alasannya, dan alternatif yang ditolak. Soal mewajibkan React + TypeScript dan Go; pilihan lain bebas.

## 1. Kriteria penilaian

1. Reviewer bisa menjalankan aplikasi tanpa API key atau akun.
2. Sesuai dengan kebutuhan soal, tanpa kompleksitas yang tidak terpakai.
3. Library aktif dipelihara dan memiliki dokumentasi resmi.
4. Mudah diuji secara otomatis.

## 2. Pilihan teknologi

Versi dicek pada 5 November 2026. Nilai persisnya dikunci oleh `package-lock.json` dan `go.sum`.

### Backend

| Kebutuhan | Pilihan | Versi | Alasan | Alternatif ditolak |
|---|---|---|---|---|
| Bahasa | Go | 1.27 | Wajib dari soal | — |
| HTTP router | `net/http` (stdlib) | 1.27 | `ServeMux` sudah mendukung method dan path parameter | Gin, chi: dependensi tambahan tanpa manfaat untuk 6 endpoint |
| Driver database | `jackc/pgx` | v5 | Driver PostgreSQL yang aktif dipelihara, dengan connection pool | GORM: menyembunyikan SQL dan menyulitkan fungsi PostGIS |
| Migrasi | `pressly/goose` | v3 | File SQL biasa dan dapat di-embed ke binary | golang-migrate: setara, tetapi embed goose lebih ringkas |
| Validasi | Kode Go sendiri | — | Menghasilkan `field` dan `code` sesuai kontrak API | go-playground/validator: perlu pemetaan error tambahan |
| Logging | `log/slog` (stdlib) | 1.27 | Log terstruktur tanpa dependensi | zap, zerolog: performa ekstra tidak dibutuhkan |

### Database

| Kebutuhan | Pilihan | Versi | Alasan | Alternatif ditolak |
|---|---|---|---|---|
| Database | PostgreSQL + PostGIS | 17 + 3.7 (`postgis/postgis:17-3.7`) | Tipe `geography`, indeks spasial, dan query area peta | SQLite: tanpa fungsi spasial bawaan; MongoDB: relasional lebih cocok untuk skema tetap |

### Frontend

| Kebutuhan | Pilihan | Versi | Alasan | Alternatif ditolak |
|---|---|---|---|---|
| UI | React | 19 | Wajib dari soal | — |
| Bahasa | TypeScript | 6.0 | Wajib dari soal; lihat §3 untuk alasan versi | — |
| Build | Vite + `@vitejs/plugin-react` | 8 + 6 | Dev server cepat dan konfigurasi sedikit | Next.js: SSR tidak dibutuhkan untuk peta internal |
| Peta | `maplibre-gl` | 6 | Open source, tanpa API key, dan rendering WebGL | Mapbox: butuh token; Google Maps: butuh akun penagihan; Leaflet: kurang lancar untuk banyak marker |
| Binding React | `@vis.gl/react-maplibre` | 8 | Komponen React resmi tim vis.gl, khusus MapLibre | `react-map-gl`: paket yang sama dengan tambahan peer Mapbox |
| Tile peta | OpenFreeMap | — | Gratis dan tanpa API key | Tile server OSM: kebijakannya tidak ditujukan untuk aplikasi umum |
| Server state | TanStack Query | 5 | Cache, refetch, dan invalidasi untuk data API | Redux: terlalu berat karena hampir semua state berasal dari server |
| Form | React Hook Form | 7 | Performa baik dan integrasi resolver | Formik: pemeliharaan kurang aktif |
| Validasi | Zod + `@hookform/resolvers` | 4 + 7 | Skema sekaligus tipe TypeScript | Yup: inferensi tipe lebih lemah |
| Styling | Tailwind CSS | 4 | Cepat dan konsisten dengan token desain | CSS Modules: perlu lebih banyak CSS manual |
| Ikon | `lucide-react` | 1 | Ikon SVG yang bisa di-tree-shake | — |
| Unit test | Vitest + Testing Library + jsdom | 5 + 16 + 30 | Satu konfigurasi dengan Vite; jsdom menyediakan DOM untuk test | Jest: perlu konfigurasi transform |
| E2E test | Playwright | 1.64 | Menguji alur nyata pada browser | Cypress: lebih berat di CI |
| Lint dan format | ESLint + typescript-eslint + Prettier | 10 + 8 + 3 | Standar ekosistem | — |

### Tooling

| Kebutuhan | Pilihan | Alasan |
|---|---|---|
| Spec-driven development | OpenSpec 1.16 | Proposal dan task tercatat sebelum implementasi |
| Agentic AI | Claude Code | Lihat [AI_USAGE](AI_USAGE.md) |
| Container | Docker Compose | Satu perintah untuk menjalankan semua layanan |
| CI dan autofix | GitHub Actions | Terintegrasi dengan repository |
| Lint Go | golangci-lint v2 | Menggabungkan banyak linter |
| Keamanan | govulncheck, `npm audit`, gitleaks | Cek kerentanan dependensi dan kebocoran secret |
| Kontrak API | OpenAPI 3.1, Redocly CLI, koleksi Postman v2.1 | Lint spesifikasi dan uji kontrak. Koleksi dijalankan Newman 6 di CI, dan dapat dijalankan Postman CLI di lokal |

## 3. Hasil cek kompatibilitas

Temuan dari pemeriksaan metadata registry pada 5 November 2026. Pada US-001, kombinasi frontend terbukti lewat instalasi, lint, test, dan build. Backend terbukti lewat build dan test terhadap PostgreSQL 18 dengan PostGIS 3.6. Image Docker serta PostgreSQL 17 dengan PostGIS 3.7 terbukti oleh CI pada Linux.

Versi terkunci saat ini: `pgx` v5.12.0, `goose` v3.29.0, dan versi frontend pada `frontend/package-lock.json`.

| Temuan | Keputusan |
|---|---|
| `typescript-eslint` 8.72 membutuhkan TypeScript `<6.1.0`, sedangkan versi `latest` TypeScript adalah 7.0.2 | Kunci TypeScript ke `~6.0.3` |
| `@vitejs/plugin-react` 6 membutuhkan Vite `^8` | Sesuai dengan Vite 8 |
| `@tailwindcss/vite` 4.3 mendukung Vite `^8` | Sesuai |
| `@hookform/resolvers` 7 mendukung Zod `^4` dan React Hook Form `^7.55` | Sesuai |
| `@vis.gl/react-maplibre` 8 membutuhkan `maplibre-gl >=4` | Sesuai dengan MapLibre 6 |
| `@testing-library/react` 16 mendukung React `^19` | Sesuai |
| Pre-bundling Vite memisahkan `maplibre-gl` 6 dari file worker-nya | `optimizeDeps.exclude` pada `vite.config.ts` |
| Build produksi tidak menyertakan worker `maplibre-gl` 6 | Impor `?worker&url` dengan `setWorkerUrl` pada `EntityMap.tsx`, dan `worker.format: 'es'` |
| Tag `postgis/postgis:17-3.7` tersedia di Docker Hub, hanya untuk `linux/amd64` | Dipakai untuk Compose dan CI; Compose menyetel `platform: linux/amd64` agar berjalan lewat emulasi di mesin ARM |
| `tiles.openfreemap.org/styles/liberty` membalas HTTP 200 | Dipakai sebagai style default |

PostgreSQL 18 tidak dipilih karena image resminya mengubah lokasi volume data. PostgreSQL 17 cukup untuk kebutuhan ini dan mengurangi risiko konfigurasi.

## 4. Keputusan terkait

Keputusan besar dicatat lebih rinci pada [folder ADR](adr/).
