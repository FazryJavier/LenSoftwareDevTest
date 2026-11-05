# Changelog

Semua perubahan pada proyek ini dicatat di sini, dengan entri terbaru di atas, agar setiap fitur dapat ditelusuri: apa yang berubah, bagaimana caranya, dan bagaimana membuktikannya. Aturan pengisiannya ada di [CLAUDE.md](CLAUDE.md#changelog).

## 2026-11-06

### US-006: Menghapus entitas

- **Jenis:** Added
- **Apa:** Tombol Hapus pada panel detail membuka dialog konfirmasi yang menyebut nama entitas. Setelah dihapus, marker hilang, panel tertutup, dan pesan sukses muncul. API `DELETE /api/v1/entities/{id}` membalas 200 dengan `data` null.
- **Bagaimana:** Kegagalan tampil pada dialog dan marker tetap ada. Bila entitas sudah dihapus pihak lain, panel tertutup dan pengguna diberi tahu. `Esc` hanya menutup dialog, bukan panel di belakangnya. Test E2E kini menghapus data ujinya lewat API.
- **File utama:** `backend/internal/store/entity_store.go`, `backend/internal/httpapi/entity_handler.go`, `frontend/src/features/entities/components/DeleteEntityDialog.tsx`, `frontend/src/features/entities/usePanel.ts`, `frontend/e2e/map.spec.ts`
- **Jejak:** US-006, FR-6, OpenSpec `add-entity-delete`, branch `feat/us-006-entity-delete`
- **Pengujian:** Test Go termasuk integrasi pada PostgreSQL 18 dengan PostGIS 3.6, 157 test Vitest, dan 31 test Playwright terhadap build produksi lulus, termasuk alur hapus dengan API sungguhan. Tidak ada baris `E2E ` yang tersisa setelah test. **Belum terbukti:** nginx dan PostgreSQL 17 dengan PostGIS 3.7 menunggu CI. Tampilan dialog belum diperiksa lewat screenshot.

### US-005: Selesai

- **Jenis:** Changed
- **Apa:** US-005 selesai, dan change OpenSpec-nya diarsipkan.
- **Bagaimana:** CI pada PR #7 lulus, lalu PR masuk lewat auto-merge.
- **File utama:** `openspec/specs/entity-update/spec.md`, `openspec/changes/archive/2026-11-06-add-entity-update/`
- **Jejak:** US-005, FazryJavier/LenSoftwareDevTest#7
- **Pengujian:** Semua check CI pada PR #7 lulus.

### US-005: Mengubah entitas

- **Jenis:** Added
- **Apa:** Tombol Ubah pada panel detail membuka form berisi data saat ini. Lokasi dapat dipindahkan dengan klik peta, mengetik koordinat, atau menggeser marker. Batal mengembalikan panel ke detail dan marker ke posisi semula. API `PUT /api/v1/entities/{id}` mengganti seluruh data, dengan validasi yang sama seperti `POST`.
- **Bagaimana:** `EntityForm` dipakai ulang untuk mode tambah dan ubah. Selama mengubah, marker asli disembunyikan dan digantikan marker sementara yang dapat digeser, juga pada mode tambah. Setelah disimpan, panel langsung menampilkan data dari respons server, dan peta memuat ulang markernya. `updated_at` memakai `clock_timestamp()`.
- **File utama:** `backend/internal/store/entity_store.go`, `backend/internal/httpapi/entity_handler.go`, `frontend/src/features/entities/components/EntityForm.tsx`, `frontend/src/features/entities/usePanel.ts`, `frontend/src/features/entities/map/EntityMap.tsx`
- **Jejak:** US-005, FR-5, FR-7, OpenSpec `add-entity-update`, branch `feat/us-005-entity-update`
- **Pengujian:** Test Go termasuk integrasi pada PostgreSQL 18 dengan PostGIS 3.6, 149 test Vitest, dan 26 test Playwright terhadap build produksi lulus, termasuk alur ubah dengan API sungguhan, geser marker, dan data yang bertahan setelah muat ulang. Mode ubah diperiksa pada ukuran desktop dan ponsel di Edge. **Belum terbukti:** nginx dan PostgreSQL 17 dengan PostGIS 3.7 menunggu CI. Perubahan bersamaan tidak dicegah, sesuai PRD.

### US-004: Selesai

- **Jenis:** Changed
- **Apa:** US-004 selesai, dan change OpenSpec-nya diarsipkan.
- **Bagaimana:** CI pada PR #6 lulus, lalu PR masuk lewat auto-merge.
- **File utama:** `openspec/specs/entity-create/spec.md`, `openspec/changes/archive/2026-11-06-add-entity-create/`
- **Jejak:** US-004, FazryJavier/LenSoftwareDevTest#6
- **Pengujian:** Semua check CI pada PR #6 lulus.

### US-004: Menambah entitas

- **Jenis:** Added
- **Apa:** Tombol Tambah membuka form. Lokasi dipilih dengan klik peta atau diketik, dengan marker sementara. Setelah disimpan, marker baru tampil dan panel membuka detailnya. API `POST /api/v1/entities` memvalidasi semua aturan PRD §5 dan melaporkan semua pelanggaran sekaligus.
- **Bagaimana:** Backend membaca input tanpa tipe, lalu `domain` memvalidasi dan menormalkannya. Decoder menolak `Content-Type` salah (415), body di atas 64 KiB (413), JSON rusak dan field tidak dikenal (400). Frontend memvalidasi lewat skema Zod dan menampilkan error 422 dari server pada field terkait. Peta dimuat ulang setelah simpan, sehingga hanya data tersimpan yang tampil. Pembatalan form yang berisi perubahan meminta konfirmasi.
- **File utama:** `backend/internal/domain/validate.go`, `backend/internal/httpapi/decode_body.go`, `backend/internal/store/entity_store.go`, `frontend/src/features/entities/components/EntityForm.tsx`, `frontend/src/features/entities/formSchema.ts`, `frontend/src/features/entities/usePanel.ts`, `frontend/src/components/ui/`
- **Jejak:** US-004, FR-4, FR-7, OpenSpec `add-entity-create`, branch `feat/us-004-entity-create`
- **Pengujian:** Test Go termasuk integrasi pada PostgreSQL 18 dengan PostGIS 3.6, 134 test Vitest, dan 21 test Playwright terhadap build produksi lulus, termasuk alur tambah dengan API sungguhan dan data yang bertahan setelah muat ulang. Form diperiksa pada ukuran desktop dan ponsel di Edge. **Belum terbukti:** nginx dan PostgreSQL 17 dengan PostGIS 3.7 menunggu CI. Pengujian silang seluruh aturan validasi dan koleksi Postman menyusul pada US-007.

### US-003: Selesai

- **Jenis:** Changed
- **Apa:** US-003 selesai, dan change OpenSpec-nya diarsipkan.
- **Bagaimana:** CI pada PR #5 lulus, lalu PR masuk lewat auto-merge.
- **File utama:** `openspec/specs/entity-detail/spec.md`, `openspec/changes/archive/2026-11-06-add-entity-detail/`
- **Jejak:** US-003, FazryJavier/LenSoftwareDevTest#5
- **Pengujian:** Semua check CI pada PR #5 lulus.

### US-003: Melihat detail entitas

- **Jenis:** Added
- **Apa:** Memilih marker membuka panel berisi nama, jenis, status, deskripsi, atribut, koordinat, serta waktu dibuat dan diperbarui. Panel ditutup dengan tombol atau `Esc`, dan menangani keadaan memuat, tidak ditemukan, serta gagal. API `GET /api/v1/entities/{id}` membalas 404 untuk entitas yang tidak ada dan 400 untuk ID yang bukan UUID.
- **Bagaimana:** Panel melayang di atas peta agar ukuran peta tidak berubah, dan selalu mengambil data terbaru dari API. Marker terpilih tampil lebih besar dan bercincin. Fokus keyboard berpindah ke tombol tutup, lalu kembali ke marker.
- **File utama:** `backend/internal/store/entity_store.go`, `backend/internal/httpapi/entity_handler.go`, `frontend/src/features/entities/components/EntityDetailPanel.tsx`, `frontend/src/features/entities/EntitiesPage.tsx`
- **Jejak:** US-003, FR-3, OpenSpec `add-entity-detail`, branch `feat/us-003-entity-detail`
- **Pengujian:** Test Go termasuk integrasi pada PostgreSQL 18 dengan PostGIS 3.6, 59 test Vitest, dan 12 test Playwright terhadap build produksi lulus. Panel diperiksa dengan data dan tile asli pada ukuran desktop di Chromium dan ukuran ponsel di Edge. Di `chromium-headless-shell`, peta tampil abu-abu saat panel terbuka di ukuran ponsel; hal ini tidak muncul di Edge, sehingga dianggap artefak browser uji. **Belum terbukti:** nginx dan PostgreSQL 17 dengan PostGIS 3.7 menunggu CI. Pada zoom rendah, marker yang bertumpuk sulit dipilih, dan di ponsel panel dapat menutupi marker terpilih.

### Proteksi `main` dan auto-merge

- **Jenis:** Changed
- **Apa:** Pull Request kini masuk ke `main` secara otomatis setelah `CI success` lulus, tanpa approval wajib. PR dengan CI gagal tertahan.
- **Bagaimana:** Auto-merge diaktifkan di setting repository, dan proteksi `main` mewajibkan `CI success` serta melarang force push dan penghapusan branch. Admin masih dapat melewatinya bila darurat.
- **File utama:** `CLAUDE.md`, `docs/WORKFLOW.md`, `docs/AI_USAGE.md`, setting repository di GitHub
- **Jejak:** Keputusan pemilik proyek. PR #4 tertahan oleh aturan ini saat `End-to-end` gagal
- **Pengujian:** Setting dibaca kembali dari GitHub API. PR #4 tertahan saat CI gagal, lalu masuk otomatis saat CI lulus.

### US-002: Bukti CI

- **Jenis:** Changed
- **Apa:** US-002 selesai, dan change OpenSpec-nya diarsipkan.
- **Bagaimana:** CI pada PR #4 membuktikan peta dan worker berjalan di belakang CSP nginx pada Compose, dengan PostgreSQL 17 dan PostGIS 3.7.
- **File utama:** `openspec/specs/entity-map-view/spec.md`, `openspec/changes/archive/2026-11-06-add-entity-map-view/`
- **Jejak:** US-002, FazryJavier/LenSoftwareDevTest#4
- **Pengujian:** 9 dari 9 check lulus pada commit `72cbe44`. Performa pada 500 marker belum diperiksa.

### US-002: Menampilkan entitas pada peta

- **Jenis:** Added
- **Apa:** Halaman awal kini berupa peta yang menampilkan entitas pada area yang terlihat. Marker memakai ikon untuk jenis dan warna untuk status. Tersedia keadaan kosong, gagal dengan tombol coba lagi, dan peringatan bila data melebihi 500. API `GET /api/v1/entities` mendukung `bbox`, `page`, dan `per_page`.
- **Bagaimana:** Data dimuat ulang setelah peta selesai bergerak, dengan debounce 300 ms, dan marker lama tetap tampil selama data baru dimuat. Filter area memakai `ST_Intersects` pada geometry, disertai migrasi `00002` yang mengganti indeks spasial. CSP nginx diperbarui untuk peta, dan worker MapLibre dibundel secara eksplisit agar ikut ke build produksi. Halaman status backend dihapus. Test integrasi kini gagal, bukan dilewati, bila berjalan di CI tanpa database, dan Dependabot mengabaikan kenaikan mayor TypeScript.
- **File utama:** `backend/internal/domain/`, `backend/internal/store/entity_store.go`, `backend/internal/httpapi/entity_handler.go`, `backend/migrations/00002_use_geometry_location_index.sql`, `frontend/src/features/entities/`, `frontend/nginx.conf`, `frontend/vite.config.ts`
- **Jejak:** US-002, FR-2, OpenSpec `add-entity-map-view`, branch `feat/us-002-map-view`
- **Pengujian:** Test Go termasuk integrasi pada PostgreSQL 18 dengan PostGIS 3.6, 41 test Vitest, dan 8 test Playwright terhadap build produksi lulus. Diperiksa dengan data dan tile asli di Chromium: 6 marker contoh tampil tanpa error console saat dimuat pada ukuran desktop dan ponsel. Percobaan CI pertama gagal karena worker tidak ikut ke build produksi, dan sudah diperbaiki. **Belum terbukti:** CSP nginx dan PostgreSQL 17 dengan PostGIS 3.7 menunggu CI, dan performa pada 500 marker belum diperiksa.

### US-001: Bukti CI pada Pull Request pertama

- **Jenis:** Changed
- **Apa:** Jalur Docker Compose kini terbukti di CI: image berhasil dibangun, ketiga layanan mencapai status sehat, dan 2 test Playwright lulus melalui nginx.
- **Bagaimana:** PR #1 menjalankan seluruh workflow untuk pertama kalinya dengan PostgreSQL 17 dan PostGIS 3.7. Status dokumen diselaraskan dengan hasil ini.
- **File utama:** `README.md`, `docs/GUIDE.md`, `docs/ITA.md`, `docs/user_stories/US-001.md`, `openspec/changes/add-project-foundation/tasks.md`
- **Jejak:** US-001, FazryJavier/LenSoftwareDevTest#1
- **Pengujian:** 9 dari 9 check PR lulus, termasuk `go test -race`, gitleaks, dan `End-to-end`. **Belum terbukti:** `docker compose stop db`, data bertahan setelah `docker compose down`, volume baru pada project terpisah, pengguna non-root di dalam container, dan graceful shutdown, karena Docker Desktop masih gagal berjalan di mesin pengembangan.

### US-001: Fondasi aplikasi

- **Jenis:** Added
- **Apa:** Backend Go dengan `GET /api/v1/health`, frontend React yang menampilkan status koneksi backend, migrasi otomatis tabel `entities`, data contoh, dan Docker Compose. Peta dan CRUD entitas belum termasuk.
- **Bagaimana:** Backend memakai `net/http`, pgx, dan goose. Semua respons memakai envelope standar, termasuk 404 dan 405 dari router, serta panic yang menjadi 500 tanpa detail internal. Konfigurasi tidak valid menghentikan aplikasi saat start. Aturan kualitas ditegakkan oleh golangci-lint dan ESLint. Port database di host memakai 5433, dan tersedia jalur tanpa Docker lewat `db/local/setup.sql`.
- **File utama:** `backend/`, `frontend/`, `db/`, `docker-compose.yml`, `docs/GUIDE.md`
- **Jejak:** US-001, FR-1, NFR-1, OpenSpec `add-project-foundation`, branch `feat/us-001-project-foundation`
- **Pengujian:** 38 test Go tanpa database dan 16 test Vitest lulus. Test integrasi `internal/store`, migrasi, seed, restart backend, dan respons 503 dibuktikan pada PostgreSQL 18 dengan PostGIS 3.6. Playwright 2 test lulus melalui Vite dan backend lokal. golangci-lint, govulncheck, `npm audit`, ESLint, typecheck, dan build lulus. **Belum terbukti:** build Dockerfile, `docker compose up`, nginx, graceful shutdown, `go test -race`, dan semua job CI di GitHub.

### Changelog wajib untuk setiap perubahan

- **Jenis:** Added
- **Apa:** Setiap perubahan kini wajib memiliki entri di `CHANGELOG.md`.
- **Bagaimana:** Aturan ditambahkan ke `CLAUDE.md` dan dokumen proses. CI menambah job `changelog` yang menggagalkan Pull Request bila file ini tidak berubah.
- **File utama:** `CHANGELOG.md`, `CLAUDE.md`, `docs/WORKFLOW.md`, `.github/workflows/ci.yml`
- **Jejak:** Permintaan pemilik proyek; commit awal
- **Pengujian:** actionlint; logika cek diuji pada repository sementara. Belum dijalankan di GitHub.

## 2026-11-05

### Aturan pengembangan pada CLAUDE.md

- **Jenis:** Added
- **Apa:** Aturan proyek dan General Rules untuk Claude Code.
- **Bagaimana:** Menambahkan struktur backend dan frontend, environment, pengujian, serta aturan kualitas. Rujukan General Rules ke proyek dan alat lain diganti dengan konteks proyek ini. `RTK.md` disalin agar `@RTK.md` terbaca.
- **File utama:** `CLAUDE.md`, `RTK.md`, `.env.example`, `docs/ARCHITECTURE.md`, `docs/user_stories/US-001.md`
- **Jejak:** Permintaan pemilik proyek; commit awal
- **Pengujian:** Pemeriksaan link dan pencarian rujukan yang tersisa.

### CI dan autofix GitHub Actions

- **Jenis:** Added
- **Apa:** Pemeriksaan otomatis dan perbaikan format pada Pull Request.
- **Bagaimana:** Job backend, frontend, dan e2e aktif sendiri setelah kodenya ada. Action dikunci ke commit SHA. Autofix hanya berjalan untuk branch di repository ini.
- **File utama:** `.github/workflows/ci.yml`, `.github/workflows/autofix.yml`, `.github/dependabot.yml`, `.github/pull_request_template.md`
- **Jejak:** Permintaan pemilik proyek; commit awal
- **Pengujian:** actionlint. Belum dijalankan di GitHub.

### Fondasi dokumen dan OpenSpec

- **Jenis:** Added
- **Apa:** Dokumen requirement dan teknis, 8 user story, kontrak OpenAPI, serta OpenSpec untuk Claude Code.
- **Bagaimana:** Kebutuhan diturunkan dari soal tes. Pilihan stack dicek terhadap versi dan peer dependency di registry. OpenSpec dipasang dengan `openspec init --tools claude`.
- **File utama:** `docs/`, `openspec/`, `.claude/`, `README.md`
- **Jejak:** Soal tes; commit awal
- **Pengujian:** Lint OpenAPI, validasi OpenSpec tanpa change, render diagram Mermaid, pemeriksaan link, dan kontras warna. Kombinasi versi belum dibuktikan lewat build.
