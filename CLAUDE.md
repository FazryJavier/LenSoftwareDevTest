# CLAUDE.md

Panduan untuk Claude Code di repository ini. Bagian **Project Rules** berisi aturan khusus proyek, sedangkan bagian **General Rules** berisi aturan umum pemilik proyek.

Bila keduanya berbeda, Project Rules yang berlaku. Pengecualiannya: aturan keamanan dan kewajiban meminta konfirmasi tidak boleh dilonggarkan.

---

# Project Rules

## Proyek

GeoEntity Manager adalah aplikasi take-home test untuk menampilkan dan mengelola entitas berlokasi geografis di peta.

| Bagian | Teknologi |
|---|---|
| Frontend | React + TypeScript, dibangun dengan Vite. **Bukan Next.js** |
| Backend | Go, `net/http`, pgx |
| Database | PostgreSQL + PostGIS |
| Peta | MapLibre + OpenFreeMap |

Status fitur ada di `docs/user_stories/README.md`. Pohon file di bawah adalah bentuk akhir yang dituju, sehingga sebagian file baru dibuat oleh user story berikutnya.

## Dokumen yang wajib dibaca

Baca sesuai tugas dan jangan menebak isinya.

| Saat mengerjakan | Baca |
|---|---|
| Fitur apa pun | `docs/PRD.md`, user story terkait di `docs/user_stories/` |
| Struktur sistem | `docs/ARCHITECTURE.md` |
| API | `docs/openapi.yaml`, `docs/API.md` |
| Database | `docs/DATABASE.md`, `docs/ERD.md` |
| UI | `docs/DESIGN_SYSTEM.md`, `docs/PROTOTYPE.md` |
| Library baru | `docs/ITA.md`, `docs/adr/` |
| Proses kerja | `docs/WORKFLOW.md` |

**Prioritas bila bertentangan:** soal tes → `docs/PRD.md` → `docs/openapi.yaml` → dokumen lain. Laporkan pertentangannya kepada pemilik proyek dan perbaiki dokumennya. Jangan diam-diam memilih salah satu.

## Alur kerja wajib

Satu user story dikerjakan dalam satu change OpenSpec dan satu branch.

1. Buat branch `feat/us-XXX-<slug>` dari `main`.
2. Jalankan `/opsx:propose <nama-change>` memakai nama change dari `docs/user_stories/README.md`.
3. Tunggu persetujuan pemilik proyek atas proposal.
4. Jalankan `/opsx:apply`, lalu implementasikan beserta test.
5. Jalankan pemeriksaan pada bagian [Perintah](#perintah), dan lakukan [tinjauan mandiri](#tinjauan-mandiri-sebelum-menyatakan-selesai).
6. Jalankan `/opsx:verify`, lalu `/opsx:archive`.
7. Perbarui `CHANGELOG.md`, status user story, `README.md`, dan `docs/AI_USAGE.md`.
8. Commit, push, dan buka Pull Request bila pemilik proyek meminta, lalu aktifkan auto-merge. PR masuk sendiri setelah `CI success` lulus.

Detailnya ada di [WORKFLOW](docs/WORKFLOW.md).

## Perintah

```bash
docker compose up --build
```

```bash
cd backend && gofmt -l . && go vet ./... && go run github.com/golangci/golangci-lint/v2/cmd/golangci-lint@v2.15.0 run && go test ./...
```

CI menjalankan `go test -race`. Di lokal, `-race` memerlukan cgo dan compiler C, sehingga boleh dilewati bila tidak tersedia, asalkan dilaporkan.

Output `npm run lint`, `ls`, dan sejenisnya dapat diringkas oleh RTK di mesin pemilik proyek. Saat hasilnya menjadi bukti, gunakan exit code atau `rtk proxy <perintah>`, dan jangan menyimpulkan dari `grep` pada output yang sudah diringkas.

```bash
cd frontend && npm run format:check && npm run lint && npm run typecheck && npm test && npm run build
```

```bash
cd frontend && npm run test:e2e
```

```bash
npx --yes @fission-ai/openspec@1.16.0 validate --all --strict
```

```bash
npx --yes @redocly/cli@2.76.0 lint docs/openapi.yaml
```

## Struktur backend

```text
backend/
├── cmd/server/main.go         # Merangkai dependensi dan menjalankan server. Tanpa logika bisnis
├── internal/
│   ├── config/config.go       # Satu-satunya tempat membaca environment
│   ├── domain/
│   │   ├── entity.go          # Entity, EntityInput, enum, ListFilter
│   │   ├── validate.go        # Aturan PRD §5
│   │   └── errors.go          # ErrNotFound, ValidationError
│   ├── httpapi/
│   │   ├── router.go          # Daftar rute dan EntityStore interface
│   │   ├── middleware.go      # Recover, request ID, log, security headers, CORS
│   │   ├── envelope.go        # writeSuccess, writeError
│   │   ├── decode.go          # Parsing query dan ID
│   │   ├── decode_body.go     # Decode JSON dan batas body
│   │   ├── dto.go             # Bentuk request dan response JSON
│   │   ├── entity_handler.go  # Handler CRUD
│   │   └── health_handler.go  # Handler health
│   └── store/
│       ├── db.go              # Pool dan interface DBTX
│       └── entity_store.go    # Semua query entities
├── migrations/
│   ├── embed.go               # go:embed untuk goose
│   └── 00001_create_entities.sql
├── seed/seed.sql              # Data contoh lokal
├── Dockerfile
├── .golangci.yml
└── go.mod
```

**Aturan**

- Arah impor hanya: `cmd → httpapi, store, config`, dan `httpapi, store → domain`. `domain` hanya boleh memakai standard library.
- `httpapi` tidak boleh mengimpor `pgx` atau `store`. `store` tidak boleh mengetahui HTTP.
- Handler hanya melakukan decode, memanggil validasi dan store, lalu menulis respons.
- Tag JSON hanya ada di `dto.go`. Tipe `domain` tidak boleh langsung dikirim sebagai respons.
- Semua respons melewati `writeSuccess` atau `writeError`. Jangan memanggil `w.Write` di handler.
- Semua SQL ada di `store` dan harus berparameter. Jangan menyusun SQL dengan `fmt.Sprintf` dari input.
- Fungsi yang melakukan I/O menerima `ctx context.Context` sebagai parameter pertama.
- `pgx.ErrNoRows` diubah menjadi `domain.ErrNotFound` di `store`.
- Bungkus error dengan `fmt.Errorf("get entity: %w", err)`. Periksa dengan `errors.Is` atau `errors.As`.
- Error di-log sekali, yaitu di lapisan HTTP, bersama request ID.
- Input dibaca sebagai nilai tanpa tipe, lalu `domain` memvalidasi tipe dan aturannya sekaligus, sehingga `0` tetap sah dan semua pelanggaran dilaporkan bersama.
- Koordinat ditulis `ST_MakePoint(longitude, latitude)`. Urutan ini wajib dicakup test integrasi.
- Tanpa `init()`, variabel global yang bisa berubah, dan `panic` di luar `main`.
- Tanpa framework HTTP, ORM, atau library validasi. Lihat [ADR-003](docs/adr/ADR-003-stdlib-http-pgx.md).

## Struktur frontend

```text
frontend/
├── index.html
├── vite.config.ts
├── src/
│   ├── main.tsx                   # Root React dan QueryClientProvider
│   ├── App.tsx
│   ├── index.css                  # Tailwind dan token desain
│   ├── api/
│   │   ├── client.ts              # Satu-satunya pemanggil fetch, membongkar envelope
│   │   └── errors.ts              # ApiError
│   ├── lib/env.ts                 # Satu-satunya pembaca import.meta.env
│   ├── components/ui/             # Button, Field, Select, Badge, Dialog, Toast, Banner
│   ├── features/entities/
│   │   ├── EntitiesPage.tsx       # Menyusun halaman dan memegang state panel
│   │   ├── api.ts                 # Fungsi endpoint entitas
│   │   ├── bbox.ts                # Batas peta menjadi parameter API
│   │   ├── format.ts              # Format tanggal dan koordinat
│   │   ├── formSchema.ts          # Skema form Zod dan payload API
│   │   ├── formErrors.ts          # Error API menjadi pesan form
│   │   ├── usePanel.ts            # Mode panel dan pengembalian fokus
│   │   ├── hooks.ts               # Hook TanStack Query dan query key
│   │   ├── schema.ts              # Skema Zod dan tipe turunannya
│   │   ├── constants.ts           # Label dan ikon per jenis dan status
│   │   ├── components/
│   │   │   ├── Panel.tsx          # Bingkai panel di atas peta
│   │   │   ├── AttributeFields.tsx
│   │   │   ├── EntityForm.tsx     # Dipakai untuk tambah dan ubah
│   │   │   ├── EntityDetailPanel.tsx
│   │   │   ├── EntityFilters.tsx
│   │   │   └── DeleteEntityDialog.tsx
│   │   └── map/                   # Satu-satunya tempat yang mengimpor MapLibre
│   │       ├── EntityMap.tsx
│   │       └── EntityMarker.tsx
│   └── test/setup.ts
├── e2e/                           # Test Playwright
├── playwright.config.ts
├── Dockerfile
├── nginx.conf
└── package.json
```

**Aturan**

- `tsconfig` memakai `strict` dan `noUncheckedIndexedAccess`.
- TypeScript dikunci ke `~6.0.3`. Lihat `docs/ITA.md` §3 sebelum mengubahnya.
- `fetch` hanya boleh dipanggil di `api/client.ts`. Respons API di-parse dengan Zod di `features/entities/api.ts`.
- Server state hanya ada di TanStack Query. Jangan menyalinnya ke `useState`.
- Jangan memakai `useEffect` untuk mengambil data atau menghitung nilai turunan.
- Query key didefinisikan di satu tempat pada `hooks.ts`. Setelah mutation, invalidate query terkait.
- Filter disimpan di URL search params. Jangan memakai `localStorage` untuk data entitas.
- Setiap tampilan data menangani keadaan loading, kosong, error, dan sukses.
- Jangan memakai `dangerouslySetInnerHTML` atau `setHTML` untuk data entitas.
- Jangan memakai `alert`, `confirm`, atau `prompt`. Gunakan `Dialog` dan `Toast`.
- Warna hanya berasal dari token di `docs/DESIGN_SYSTEM.md`. Hindari nilai heksadesimal di komponen dan arbitrary value Tailwind.
- Pakai named export dan hindari barrel file `index.ts`.

## Environment

File `.env` di root hanya dibaca oleh Docker Compose. `.env` tidak di-commit, dan `.env.example` selalu diperbarui bersamaan bila ada variabel baru. Tanpa Docker, variabel disetel langsung di terminal seperti pada `docs/GUIDE.md`.

| Variabel | Dipakai oleh | Wajib | Keterangan |
|---|---|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Container database | Ya | Hanya nilai lokal |
| `POSTGRES_PORT`, `BACKEND_PORT`, `FRONTEND_PORT` | Compose | Tidak | Port di mesin host; default 5433, 8080, dan 5173 |
| `DATABASE_URL` | Backend | Ya | Tanpa nilai default |
| `HTTP_ADDR` | Backend | Tidak | Default `:8080`; Compose selalu memakai `:8080` di dalam container |
| `CORS_ALLOWED_ORIGINS` | Backend | Tidak | Dipisah koma; kosong berarti tidak ada origin lain yang diizinkan; `*` ditolak |
| `TEST_DATABASE_URL` | Test integrasi | Hanya untuk test integrasi | Nama database wajib berakhiran `_test` |
| `VITE_MAP_STYLE_URL` | Frontend, saat build | Ya | URL style peta |
| `API_PROXY_TARGET` | Vite dev server | Tidak | Default `http://localhost:8080`; tidak dipakai di Compose |

**Aturan**

- `os.Getenv` hanya boleh ada di `internal/config`. `config.Load` melaporkan semua variabel yang tidak valid sekaligus, dan aplikasi berhenti saat start.
- `import.meta.env` hanya boleh dibaca di `src/lib/env.ts`, dan nilainya divalidasi dengan Zod.
- Semua variabel `VITE_*` masuk ke bundle dan dapat dibaca publik, sehingga tidak boleh berisi secret.
- Frontend memanggil API lewat path relatif `/api/v1`, sehingga tidak ada variabel URL API.
- Nilai secret asli tidak boleh ditulis ke kode, dokumen, log, atau `.env.example`.
- Agent tidak membaca `.env`. Gunakan `.env.example` untuk mengetahui bentuknya.

## Pengujian

**Yang wajib dijalankan menurut jenis perubahan**

| Perubahan | Wajib |
|---|---|
| `domain` | Unit test Go |
| Handler atau middleware | Unit test Go dengan `httptest` dan store palsu |
| Query atau migrasi | Test integrasi Go dengan PostGIS |
| Kontrak API | Lint OpenAPI, unit test Go, dan koleksi Postman |
| Komponen atau hook | Vitest |
| Alur pengguna | Vitest dan Playwright |
| Aturan validasi | Test backend **dan** frontend memakai kasus yang sama |

**Backend**

- Gunakan paket `testing` dan table-driven test. Tanpa testify.
- Test berada di samping kodenya, dengan nama `TestSubjek_Kondisi_Hasil`.
- Store palsu ditulis manual. Handler tidak memerlukan database untuk diuji.
- Test integrasi membaca `TEST_DATABASE_URL`, dilewati bila kosong, dan harus **gagal** bila nama database tidak berakhiran `_test`.
- Isolasi test integrasi memakai transaksi yang di-rollback. Jangan memakai `TRUNCATE` atau `DROP`.

**Frontend**

- Cari elemen berdasarkan role, label, atau teks yang dilihat pengguna. `data-testid` hanya untuk marker peta.
- Uji perilaku yang terlihat, bukan state internal. Jangan memakai snapshot test.
- Komponen diuji dengan `fetch` palsu. `@vis.gl/react-maplibre` di-mock pada Vitest karena tidak ada WebGL.
- Interaksi peta sungguhan diuji dengan Playwright.
- Test E2E membuat datanya sendiri lewat API dan menghapusnya setelah selesai. Jangan memakai `waitForTimeout`.

**Aturan umum**

- Setiap perbaikan bug diawali test yang gagal.
- Setiap kriteria penerimaan user story harus dapat ditunjuk ke test atau pemeriksaan manual yang tercatat.
- Nilai batas wajib diuji, termasuk koordinat `0`, `90`, `-90`, `180`, dan `-180`, serta panjang teks tepat di batas.
- Jangan menghapus, melewati, atau melemahkan test agar lulus. Test yang salah diperbaiki beserta alasannya.
- Persentase coverage bukan target. Assertion harus membuktikan perilaku.
- Test tidak boleh bergantung pada internet, urutan, atau waktu saat ini.

## Aturan agar hasil tidak asal jadi

Aturan ini berlaku untuk setiap perubahan, termasuk yang kecil.

**Ruang lingkup**

- Kerjakan hanya kriteria penerimaan user story yang sedang berjalan.
- Jangan menambah fitur, opsi konfigurasi, atau refactor di luar permintaan. Catat temuan lain untuk dibahas.
- Jangan membuat abstraksi untuk kebutuhan masa depan. Interface hanya untuk batas pengujian atau bila implementasinya sudah lebih dari satu.
- Tunggu sampai ada tiga pemakaian sebelum mengekstrak kode yang mirip.
- Jangan menambah dependensi tanpa mencatat alasannya di `docs/ITA.md`.

**Kode**

- Jangan membuat file atau paket bernama `utils`, `helpers`, `common`, `shared`, atau `misc`. Namai menurut fungsinya.
- Hindari nama generik seperti `data`, `info`, `item`, `manager`, `process`, atau `handleStuff`.
- Jangan meninggalkan kode yang tidak terpakai, kode yang dikomentari, atau `TODO` tanpa file di `docs/issue/`.
- Komentar menjelaskan **alasan**, bukan mengulang isi kode.
- Tangani error secara eksplisit. Jangan memakai blok `catch` kosong, `_ = err`, atau mengembalikan nilai palsu saat gagal.
- Jangan membuat fallback untuk keadaan yang tidak mungkin terjadi. Validasi hanya di batas sistem.
- Jangan meninggalkan `console.log`, `fmt.Println`, atau log debug.
- Jangan memakai `any`, `@ts-ignore`, atau `as` untuk melewati pemeriksaan tipe. Gunakan `unknown` lalu parse dengan Zod.
- `eslint-disable`, `@ts-expect-error`, dan `//nolint` hanya boleh dipakai dengan alasan pada baris yang sama.
- Nilai enum, batas validasi, dan label memiliki satu sumber per layer. Jangan menulis ulang nilainya di tempat lain.

**Ukuran**

Batas berikut adalah tanda untuk meninjau ulang. Melewatinya harus punya alasan yang jelas.

| Hal | Batas |
|---|---|
| File | 300 baris |
| Fungsi Go | 50 baris |
| Komponen React | 150 baris |
| Satu change | Satu user story |

**Kebenaran**

- Jangan mengarang API, opsi, atau perilaku library. Periksa dokumentasi resmi versi yang terpasang, atau tipe dan source-nya.
- Jangan mengklaim sesuatu berjalan tanpa menjalankannya. Sertakan perintah dan hasilnya.
- Setelah dua kali gagal dengan pendekatan yang sama, berhenti, jelaskan temuannya, dan cari akar masalah. Jangan menumpuk tambalan.
- Jangan mengubah test, konfigurasi lint, atau aturan CI hanya untuk membuat pemeriksaan lulus.

**Antarmuka**

- Ikuti `docs/DESIGN_SYSTEM.md` dan `docs/PROTOTYPE.md`. Jangan menambah gaya baru tanpa memperbarui dokumennya.
- Hindari ornamen tanpa fungsi seperti gradien, glassmorphism, emoji sebagai ikon, bayangan berlebihan, dan animasi dekoratif.
- Semua teks UI berbahasa Indonesia, spesifik, dan tanpa placeholder seperti "Lorem ipsum".
- Pesan error menjelaskan apa yang salah dan apa yang bisa dilakukan pengguna.
- Semua kontrol dapat dipakai dengan keyboard dan memiliki label.

**Dokumen dan pesan**

- Tulis hanya yang berguna bagi pembaca. Jangan membuat dokumen baru bila dokumen yang ada bisa diperbarui.
- Dokumen harus sesuai dengan kode. Perilaku yang berubah berarti dokumennya ikut berubah dalam PR yang sama.
- Fitur yang belum selesai harus tertulis jelas di `README.md`.

## Tinjauan mandiri sebelum menyatakan selesai

1. Baca seluruh `git diff`, seakan meninjau kode orang lain.
2. Periksa setiap kriteria penerimaan satu per satu, dan tunjukkan buktinya.
3. Hapus kode yang tidak terpakai, log debug, dan perubahan di luar ruang lingkup.
4. Jalankan semua pemeriksaan pada bagian [Perintah](#perintah) yang relevan.
5. Untuk perubahan UI, jalankan aplikasi dan coba alurnya di browser.
6. Perbarui `CHANGELOG.md`, dokumen terkait, dan `docs/AI_USAGE.md`.
7. Laporkan yang belum diverifikasi secara jujur.

## Batasan keamanan

Minta konfirmasi eksplisit sebelum melakukan hal berikut:

- `docker compose down -v`, `DROP`, `TRUNCATE`, `DELETE` massal, atau reset migrasi.
- `git push --force`, `git reset --hard`, atau penulisan ulang riwayat.
- Push langsung ke `main`, atau perubahan pengaturan repository.
- Mengirim email atau menyerahkan hasil tes.

Perubahan skema selalu melalui migrasi baru. File migrasi yang sudah di-commit tidak boleh diubah.

## Git

Format commit mengikuti General Rules. Nama branch: `feat/us-XXX-<slug>`, `fix/<slug>`, `docs/<slug>`, atau `chore/<slug>`. Scope commit memakai `backend`, `frontend`, `db`, `api`, `ci`, atau `docs`.

`main` diproteksi: perubahan masuk lewat Pull Request dan wajib lulus `CI success`, tanpa wajib review. PR boleh di-merge tanpa approval pemilik proyek setelah CI lulus, karena pemilik proyek menetapkannya demikian pada 6 November 2026. PR dengan CI gagal atau konflik tidak di-merge, melainkan diperbaiki atau dilaporkan.

## Changelog

Setiap perubahan, termasuk dokumen, konfigurasi, dan perbaikan kecil, wajib dicatat di [CHANGELOG.md](CHANGELOG.md) dalam commit atau PR yang sama. Entri terbaru ditulis paling atas, di bawah judul tanggalnya.

```markdown
### US-002: Menampilkan entitas pada peta

- **Jenis:** Added / Changed / Fixed / Removed / Security
- **Apa:** Perilaku yang berubah, dari sudut pandang pengguna atau pemakai API.
- **Bagaimana:** Pendekatan dan keputusan penting, bukan daftar baris kode.
- **File utama:** `path/ke/file`
- **Jejak:** US-002, OpenSpec `add-entity-map-view`, branch `feat/us-002-map-view`, PR bila sudah ada
- **Pengujian:** Perintah atau test yang benar-benar dijalankan dan hasilnya, serta yang belum.
```

- Judul memakai ID dan judul user story. Perubahan tanpa user story memakai judul singkat, dan **Jejak** menyebut alasannya, misalnya nomor issue.
- Satu fitur memiliki satu entri. Bila masih dikerjakan di branch yang sama, perbarui entrinya, jangan membuat entri baru.
- Perubahan pada perilaku yang sudah dicatat ditulis sebagai entri baru. Entri lama yang sudah masuk `main` tidak diubah.
- Tulis hanya yang benar-benar terjadi. Hal yang belum diverifikasi harus disebut sebagai belum diverifikasi.
- Perbedaan peran: `CHANGELOG.md` mencatat perubahan pada proyek, sedangkan `docs/AI_USAGE.md` mencatat peran AI dan kandidat.

Job `changelog` di CI menggagalkan PR yang tidak mengubah `CHANGELOG.md`. Commit dari workflow autofix dan PR Dependabot dikecualikan.

## Transparansi penggunaan AI

Soal tes meminta penjelasan sejauh mana Agentic AI digunakan. Setiap selesai satu pekerjaan, tambahkan baris ke [AI_USAGE](docs/AI_USAGE.md) secara jujur. Catat juga hasil AI yang keliru, dan masalah penting ke `docs/issue/`.

Folder `.claude/`, `openspec/`, dan `RTK.md` sengaja di-commit agar penilai dapat memeriksanya. Jangan menambahkannya ke `.gitignore`.

RTK yang disebut pada General Rules adalah alat di mesin pemilik proyek dan tidak diperlukan untuk menjalankan aplikasi atau CI.

---

# General Rules

@RTK.md

# Global API Response Contract

When creating or modifying an HTTP API, use this response envelope consistently unless an external protocol or an existing project contract explicitly requires another format:

```json
{
  "code": 200,
  "success": true,
  "message": "Entity retrieved.",
  "data": {},
  "errors": null,
  "meta": null
}
```

## Envelope Rules

- `code` must contain the effective HTTP status code. Keep the HTTP status line and the envelope `code` consistent.
- `success` must be `true` for successful responses and `false` for failed responses.
- `message` must be concise, stable, human-readable, and safe to expose to API consumers. Do not expose stack traces, SQL, secrets, or internal implementation details.
- `data` contains the successful response payload. Use `null` when there is no successful payload; do not invent an inconsistent shape between endpoints.
- `errors` must be `null` on success. On failure, provide a structured, machine-readable value such as an array or object containing field, validation, authorization, or domain errors.
- `meta` must be `null` when no metadata exists. Use it for pagination, cursors, totals, request identifiers, or other documented response metadata, not for primary business data.
- Preserve the envelope for validation, authentication, authorization, not-found, conflict, rate-limit, and server errors whenever the project owns the API contract.
- Use appropriate HTTP status codes. Do not return HTTP 200 for failures merely because the JSON envelope has a `code` field.
- Keep success and error payloads backward-compatible once published. Any intentional breaking change requires explicit documentation and versioning according to the project convention.
- Document endpoint-specific `data`, `errors`, and `meta` schemas. For paginated collections, put the collection in `data` and pagination details in `meta`.
- Do not apply this envelope to protocols with their own mandatory wire format, such as GraphQL, webhooks with a consumer-owned schema, third-party integrations, streaming protocols, or standards that explicitly require another shape.

# General Engineering Rules

## Communication

- Be concise, direct, and technically accurate.
- Lead with the outcome and avoid unnecessary filler or repetition.
- State assumptions, limitations, unresolved risks, and skipped verification clearly.
- Prefer actionable instructions and concrete file or command references.

## Repository Understanding

- Inspect the repository structure, documentation, configuration, dependencies, conventions, and relevant tests before modifying code.
- Follow existing project patterns unless there is a clear technical reason to change them.
- Treat existing uncommitted changes as user-owned. Never overwrite, revert, or delete them without explicit confirmation.
- Keep changes focused on the requested scope.

## Code Quality

- Prefer readable, maintainable, testable code with clear naming and explicit data flow.
- Use appropriate typing and validation where supported by the language or framework.
- Apply SOLID and DRY principles pragmatically; avoid premature abstraction and speculative features.
- Preserve backward compatibility unless a breaking change is explicitly requested.
- Handle expected errors explicitly. Do not silently swallow exceptions or failed commands.
- Consider timeouts, retries, idempotency, concurrency, partial failure, and resource cleanup where relevant.

## Security

- Never hardcode secrets, credentials, tokens, private keys, or API keys.
- Validate and sanitize untrusted input at system boundaries.
- Apply least privilege and enforce authorization on the server side.
- Protect against applicable risks including injection, XSS, CSRF, SSRF, insecure direct object references, path traversal, and sensitive-data exposure.
- Do not log secrets or sensitive personal data.
- Review security implications whenever authentication, authorization, input handling, personal data, or external integrations such as map tiles change.

## API Design Standards

- Use the project's established API versioning convention. For new APIs without an existing convention, prefer an explicit version such as `/api/v1`.
- Use correct HTTP methods, status codes, headers, content types, and cache semantics. Do not return HTTP 200 for failures.
- Document public or cross-team APIs with OpenAPI or the repository's established equivalent.
- Define stable schemas for `data`, `errors`, and `meta`; do not expose internal database models directly.
- Use a structured validation error format, for example an array containing `field`, `code`, and `message`.
- For collections, place the collection in `data` and pagination details such as `page`, `per_page`, `total`, `total_pages`, or cursors in `meta`.
- Use idempotency keys for retryable, side-effecting operations such as entity creation when applicable. They are currently out of scope for this project; see `docs/PRD.md` §7.
- Support request or correlation IDs for tracing across services. Return the identifier in documented metadata or headers without exposing sensitive information.
- Define rate-limit behavior using HTTP 429 and document retry information when applicable.
- Maintain backward compatibility for published response fields. Breaking changes require explicit documentation, versioning, and a migration plan.
- Respect protocol-specific requirements for `Content-Type`, `Accept`, encoding, payload size, and streaming.

## Documentation and Dependencies

- Use official, current documentation for third-party libraries, APIs, frameworks, and tools.
- Use available documentation tools or local references when appropriate; do not rely on memory for version-sensitive syntax.
- Before adding a dependency, check whether the capability already exists, then consider maintenance, security advisories, licensing, bundle size, and compatibility.
- Update documentation when behavior, configuration, API contracts, or operational procedures change.

## Testing and Verification

- Add or update tests according to the risk and scope of the change.
- Cover acceptance criteria, success paths, failure paths, security-sensitive paths, and important edge cases.
- Run the narrowest relevant checks first, then broader checks when practical.
- Do not claim completion until the implementation has been verified.
- If verification cannot be performed, state exactly what was not run and why.

## Safe Operations

- Ask for explicit confirmation before destructive or difficult-to-reverse operations.
- Treat force-pushes, hard resets, rebases, branch deletion, database destruction, production changes, bulk deletion, permission changes, and secret replacement as high risk.
- Prefer reversible operations and dry runs where available.
- Verify exact targets before deleting, moving, or overwriting files.

## Change Management

- Update `CHANGELOG.md` for every change, following the Changelog section in the Project Rules.
- Do not create unrelated documentation, formatting, dependency, or metadata churn.
- Follow the repository's existing branch, commit, release, and deployment conventions.

## Completion Report

At the end of a task, summarize the changes, affected files or components, tests and verification commands executed, and known limitations or remaining risks.

## Database and Destructive Operations

- NEVER reset, drop, truncate, refresh, rollback, or recreate a database without explicit user confirmation.
- This includes commands such as `goose down`, `goose reset`, `docker compose down -v`, `DROP DATABASE`, `DROP TABLE`, `TRUNCATE`, destructive seeders, and bulk `DELETE` queries.
- Before any database-changing command, verify the target environment, database name, connection, and whether the operation is reversible.
- Prefer migrations, transactions, backups, dry runs, and targeted changes.
- Never run destructive database commands against production or an unknown environment.

## Mandatory Testing Gate

- Add or update unit tests for every new feature, bug fix, refactor, validation rule, API endpoint, and security-sensitive change.
- Add integration or end-to-end tests when behavior crosses module, database, network, authentication, or API boundaries.
- Tests must cover acceptance criteria, success paths, failure paths, authorization, validation, and relevant edge cases.
- Run the relevant test suite after implementation.
- If tests fail, diagnose and fix the implementation or tests, then rerun them.
- Do not declare the task complete while relevant tests are failing.
- Report all tests that were run, including skipped or unavailable checks.

## OWASP Security Review

- Review every security-sensitive change against the applicable OWASP Top 10 risks:
  - Broken Access Control
  - Cryptographic Failures
  - Injection
  - Insecure Design
  - Security Misconfiguration
  - Vulnerable and Outdated Components
  - Identification and Authentication Failures
  - Software and Data Integrity Failures
  - Security Logging and Monitoring Failures
  - Server-Side Request Forgery
- Validate input, enforce authorization server-side, protect secrets, use secure defaults, and avoid exposing sensitive data.
- Run available dependency, secret, static-analysis, and security tests before completion.
- Do not claim security compliance merely because a checklist was reviewed; record limitations and unverified areas.

## Commit, Push, and Merge Workflow

- Use Conventional Commits where the repository supports them: `<type>(<scope>): <imperative summary>`.
- Every commit must have a clear, specific title that explains what changed. Avoid titles such as `update`, `fix stuff`, `changes`, or `wip` unless the repository explicitly requires them.
- Every commit that changes application behavior, an API contract, a database, security, configuration, or multiple files must include a descriptive body. A body is optional only for genuinely trivial changes such as a one-line typo or formatting correction.
- A descriptive commit body should include, when applicable:
  - `What`: the problem or capability addressed.
  - `Why`: the reason for the change and expected impact.
  - `Changes`: the important implementation or behavior changes.
  - `Testing`: tests or verification commands run and their results.
  - `Security`: security implications or checks performed.
  - `Database`: migrations, schema, seed, or data changes, or an explicit statement that none were made.
  - `Refs`: the relevant issue, task, or ticket reference.
- Keep commit subjects concise and specific, but use the body to provide enough context for someone reviewing `git log` or `git show` without opening the Pull Request.
- Do not use vague commit messages such as `update`, `changes`, `fix stuff`, or `work`; split unrelated work or explain each distinct change in the body.
- Before committing, inspect the staged diff and verify that the commit title accurately represents the complete staged change.
- Before committing a non-trivial change, generate or request a commit message preview. Do not silently accept an auto-generated message that lacks What, Why, Changes, or Testing context.
- Before opening a Pull Request, inspect the complete branch diff and commit list. The Pull Request must account for all intended commits on the branch, not only the latest commit.
- Do not squash, amend, reorder, or rewrite existing commits unless explicitly requested or required by the repository workflow. Never amend a commit that may already have been pushed without confirmation.
- Never push directly to protected branches, including `main`, `master`, `develop`, `development`, `staging`, and `production`, or their clearly equivalent case-insensitive names.
- If work is started while checked out to a protected branch, stop before creating commits and create a new branch based on the protected branch. Use a descriptive branch name based on the change, such as `feat/<short-description>`, `fix/<short-description>`, `refactor/<short-description>`, or the repository's required task format.
- If the current branch is protected, do not make implementation changes there before branching unless the user explicitly instructs otherwise.
- Push only the feature, fix, refactor, or task branch. The merge or pull request target may be a protected branch according to the repository workflow, but the source branch must never be a protected branch.
- Do not merge directly from the local agent unless the user explicitly requests a merge and repository policy allows it. Prefer opening a Pull Request for review.

### Required Commit and Pull Request Content

- A commit or Pull Request title must be concise, specific, and describe the primary outcome.
- A non-trivial commit message must use this structure when applicable:
  ```text
  <type>(<scope>): <specific outcome>

  What: <problem or capability addressed>
  Why: <reason and expected impact>
  Changes:
  - <important implementation or behavior change>
  - <additional relevant change>
  Testing: <commands run and result>
  Security: <security impact/checks, or N/A>
  Database: <database impact, or N/A>
  Refs: <issue/task reference, or omit when unavailable>
  ```
- Commit bodies must describe the actual staged diff. Never claim tests, scans, migrations, or reviews that were not performed.
- A Pull Request description must include, when applicable:
  - `What`: the problem or requested capability.
  - `Why`: the reason and expected impact.
  - `Changes`: the main implementation changes, including all relevant commits on the branch.
  - `Testing`: commands run and their results.
  - `Security`: security implications, OWASP considerations, and scans performed.
  - `Database`: migrations, schema changes, seed changes, or an explicit statement that none were made.
  - `Checklist`: tests passed, documentation updated, backward compatibility checked, and deployment or rollback considerations.
  - `Risks and Follow-up`: known limitations, skipped checks, or required post-merge actions.
- Do not create a Pull Request with an auto-generated placeholder title or empty description.
- When a branch contains multiple commits, summarize the combined outcome and meaningful commit groups. Do not describe only the latest commit.
- Before push or Pull Request creation, verify the target branch, source branch, remote, commits ahead, working tree status, and whether the branch contains unrelated changes.
- After a partial failure while committing, pushing, or opening a Pull Request, report exactly which stages completed and resume from the failed stage without undoing completed work.

<!-- postman-cli:installation:start -->
Postman CLI is installed on this device, and can be used for API Engineering work.
<!-- postman-cli:installation:end -->
