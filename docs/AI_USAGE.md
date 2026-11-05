# Penggunaan Agentic AI

Dokumen ini menjawab permintaan soal: *"Jelaskan workflow penggunaan Agentic AI sejauh apa pada pengerjaan test ini."* Catatan diperbarui selama pengerjaan dan hanya berisi hal yang benar-benar terjadi.

## Alat

| Alat | Fungsi | Lokasi di repository |
|---|---|---|
| Claude Code (desktop app, model Claude Opus) | Agent yang membaca file, menjalankan perintah, dan menulis dokumen serta kode | `CLAUDE.md`, `RTK.md`, `.claude/` |
| OpenSpec 1.16 | Kerangka spec-driven development yang dijalankan melalui Claude Code | `openspec/`, `.claude/skills/`, `.claude/commands/opsx/` |

Claude Code termasuk Agentic AI karena dapat merencanakan langkah, memakai tool, memeriksa hasilnya, dan melanjutkan pekerjaan multi-langkah, bukan hanya menjawab pertanyaan.

## Batas peran AI

Alur dan pembagian peran dijelaskan di [WORKFLOW](WORKFLOW.md#2-pembagian-peran). Kendali yang diterapkan:

- `CLAUDE.md` memberi aturan proyek dan membatasi tindakan berisiko.
- `.claude/settings.json` memblokir perintah destruktif tertentu dan pembacaan `.env`.
- Proposal OpenSpec harus disetujui kandidat sebelum implementasi.
- CI memeriksa ulang hasil kerja secara independen.
- Commit dan push dilakukan atas instruksi kandidat, dan PR hanya masuk ke `main` bila CI lulus.
- Pengiriman hasil dilakukan oleh kandidat.

## Log pekerjaan

| Tanggal | Pekerjaan | Peran AI | Peran kandidat | Verifikasi |
|---|---|---|---|---|
| 2026-11-05 | Membaca soal | Membaca PDF dan merangkum kebutuhan | Meminta dan menetapkan folder kerja | Rangkuman dibandingkan dengan PDF |
| 2026-11-05 | Fondasi dokumen | Menyusun `docs/`, `CLAUDE.md`, dan README; memilih stack; mengecek versi dan peer dependency dari registry | Menentukan daftar dokumen, penggunaan OpenSpec, CI, autofix, dan kebijakan `.gitignore` | Lint OpenAPI, validasi OpenSpec, actionlint, dan render Mermaid. Tinjauan kandidat: menunggu |
| 2026-11-05 | Setup OpenSpec | Menjalankan `openspec init --tools claude` | Meminta penggunaan OpenSpec | File hasil init dicek dengan `git status` |
| 2026-11-05 | CI dan autofix | Menulis workflow GitHub Actions dengan action yang dikunci ke commit SHA | Meminta base CI dan autofix | actionlint. Belum dijalankan di GitHub |
| 2026-11-05 | Aturan `CLAUDE.md` | Menyusun aturan khusus proyek: struktur backend dan frontend, env, pengujian, dan pencegahan hasil asal jadi | Menyediakan General Rules, menetapkan React + TypeScript sesuai soal, dan akan merevisi aturan khusus proyek | General Rules dibandingkan dengan file sumber, lalu rujukan ke proyek dan alat lain diganti atas permintaan kandidat; cek link. Tinjauan kandidat: menunggu |
| 2026-11-06 | Changelog wajib | Membuat `CHANGELOG.md`, aturan pengisian, dan job CI | Meminta setiap perubahan dapat ditelusuri | actionlint, uji logika cek pada repository sementara, dan cek link. Belum dijalankan di GitHub |
| 2026-11-06 | US-001 | Menulis proposal OpenSpec, kode backend dan frontend, test, Dockerfile, Compose, dan dokumen; menjalankan test dan membuktikan perilaku terhadap database lokal | Menyetujui proposal, memilih jalur PostGIS lokal saat Docker gagal, memasang PostGIS, dan menjalankan script database dengan password superuser miliknya | Lihat bagian Pengujian di CHANGELOG. Jalur Docker dan CI belum terbukti. Tinjauan kode oleh kandidat: menunggu |
| 2026-11-06 | Bukti CI US-001 dan proposal US-002 | Membaca log CI, memeriksa bahwa test benar-benar berjalan, serta menulis proposal OpenSpec US-002 | Menggabungkan PR #1, serta meminta lanjut ke fitur berikutnya | CI lulus 9 dari 9. Validasi OpenSpec strict. Kandidat menyetujui proposal |
| 2026-11-06 | US-002 | Menulis kode, test, dan dokumen; memeriksa peta di browser sungguhan | Menyetujui proposal | CI lulus 9 dari 9 pada percobaan kedua, termasuk CSP nginx. PR masuk lewat auto-merge, dan tinjauan kode oleh kandidat tidak tercatat |
| 2026-11-06 | Aturan merge dan proteksi `main` | Menyiapkan auto-merge dan proteksi `main`; menahan PR dengan CI gagal | Memutuskan bahwa PR tidak perlu approval, menyetujui perubahan setting repository, dan menutup PR Dependabot yang tidak kompatibel atas saran Claude | Setting dibaca kembali dari GitHub |
| 2026-11-06 | US-003 | Menulis proposal, kode, test, dan dokumen; memeriksa panel di browser | Menyetujui proposal | Lihat bagian Pengujian di CHANGELOG. CI menunggu |

## Temuan yang dipengaruhi AI

| Temuan | Tindakan |
|---|---|
| AI menemukan `typescript-eslint` belum mendukung TypeScript 7 saat mengecek peer dependency | TypeScript dikunci ke `~6.0.3` ([ITA §3](ITA.md#3-hasil-cek-kompatibilitas)) |

## Kesalahan AI

Kesalahan yang ditemukan dicatat di sini atau di [`docs/issue/`](issue/README.md).

| Tanggal | Kesalahan | Ditemukan oleh | Perbaikan |
|---|---|---|---|
| 2026-11-05 | Draf awal `autofix.yml` memakai `git add ... \|\| true`. Bila salah satu folder belum ada, perintah gagal diam-diam dan perbaikan di folder lain tidak ikut ter-stage | Claude, saat meninjau ulang hasilnya sendiri | Stage per folder setelah mengecek keberadaannya |
| 2026-11-06 | Draf `docker-compose.yml` me-mount `db/init` ke subfolder yang diabaikan entrypoint PostgreSQL, sehingga `geoentity_test` tidak akan dibuat | Claude, saat meninjau ulang hasilnya sendiri, sebelum Compose pernah dijalankan | Mount per file |
| 2026-11-06 | Claude menyimpulkan PostGIS belum terpasang dari `grep` pada output `ls` yang sudah diringkas RTK, sehingga kandidat diminta memasangnya. Kondisi sebelum pemasangan tidak dapat dipastikan | Claude, saat pengecekan yang sama gagal setelah pemasangan | Cek file secara langsung; aturan bukti ditambahkan ke `CLAUDE.md` |
| 2026-11-06 | Rancangan query area di `docs/DATABASE.md` memakai `&&` pada `geography`, yang salah untuk area luas | Claude, saat menulis query US-002 | `ST_Intersects` pada geometry dan migrasi `00002`, dikunci dengan test seluruh dunia dan area luas |
| 2026-11-06 | Worker MapLibre gagal dimuat di Vite dev server, sehingga peta dasar kosong, padahal test marker tetap lulus. CSP rancangan juga tidak mengizinkan worker dari origin sendiri | Claude, saat memeriksa di browser sungguhan | `optimizeDeps.exclude`, CSP diperbaiki, dan test E2E kini gagal bila worker tidak termuat |
| 2026-11-06 | Perbaikan worker hanya menyelesaikan dev server. Build produksi tetap tidak berisi file worker, dan Claude sudah menyatakan peta berfungsi berdasarkan pengujian dev server | Job `e2e` di CI, lewat test regresi yang ditambahkan Claude | Worker dibundel eksplisit, dan 8 test dijalankan terhadap build produksi |
| 2026-11-06 | Tampilan awal memakai zoom tetap, sehingga pada layar sempit Pulau Jawa di luar area dan data contoh tidak tampil | Claude, saat memeriksa di browser sungguhan | Tampilan awal memakai `bounds` |
| 2026-11-06 | Claude menghentikan `npm run dev` milik kandidat karena filter proses terlalu longgar, padahal seharusnya hanya server ujinya sendiri. Sebelumnya, 3 test E2E gagal karena mengenai backend kandidat yang masih versi lama | Claude, dari baris perintah proses yang dicetak saat dihentikan | Diakui kepada kandidat. Filter dipersempit, dan server uji dipisahkan lewat port serta flag khusus. Tidak ada data yang hilang |
| 2026-11-06 | Draf test mengharapkan redirect 301 dari `ServeMux`, padahal hasilnya 307. Draf test lain tidak membuktikan perilaku apa pun | Test yang gagal dan tinjauan Claude | Test diperbaiki dan test kosong dihapus |
