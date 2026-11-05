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
- Commit, push, merge, dan pengiriman hasil dilakukan atas instruksi kandidat.

## Log pekerjaan

| Tanggal | Pekerjaan | Peran AI | Peran kandidat | Verifikasi |
|---|---|---|---|---|
| 2026-11-05 | Membaca soal | Membaca PDF dan merangkum kebutuhan | Meminta dan menetapkan folder kerja | Rangkuman dibandingkan dengan PDF |
| 2026-11-05 | Fondasi dokumen | Menyusun `docs/`, `CLAUDE.md`, dan README; memilih stack; mengecek versi dan peer dependency dari registry | Menentukan daftar dokumen, penggunaan OpenSpec, CI, autofix, dan kebijakan `.gitignore` | Lint OpenAPI, validasi OpenSpec, actionlint, dan render Mermaid. Tinjauan kandidat: menunggu |
| 2026-11-05 | Setup OpenSpec | Menjalankan `openspec init --tools claude` | Meminta penggunaan OpenSpec | File hasil init dicek dengan `git status` |
| 2026-11-05 | CI dan autofix | Menulis workflow GitHub Actions dengan action yang dikunci ke commit SHA | Meminta base CI dan autofix | actionlint. Belum dijalankan di GitHub |
| 2026-11-05 | Aturan `CLAUDE.md` | Menyusun aturan khusus proyek: struktur backend dan frontend, env, pengujian, dan pencegahan hasil asal jadi | Menyediakan General Rules, menetapkan React + TypeScript sesuai soal, dan akan merevisi aturan khusus proyek | General Rules dibandingkan dengan file sumber, lalu rujukan ke proyek dan alat lain diganti atas permintaan kandidat; cek link. Tinjauan kandidat: menunggu |
| 2026-11-06 | Changelog wajib | Membuat `CHANGELOG.md`, aturan pengisian, dan job CI | Meminta setiap perubahan dapat ditelusuri | actionlint, uji logika cek pada repository sementara, dan cek link. Belum dijalankan di GitHub |

## Temuan yang dipengaruhi AI

| Temuan | Tindakan |
|---|---|
| AI menemukan `typescript-eslint` belum mendukung TypeScript 7 saat mengecek peer dependency | TypeScript dikunci ke `~6.0.3` ([ITA §3](ITA.md#3-hasil-cek-kompatibilitas)) |

## Kesalahan AI

Kesalahan yang ditemukan dicatat di sini atau di [`docs/issue/`](issue/README.md).

| Tanggal | Kesalahan | Ditemukan oleh | Perbaikan |
|---|---|---|---|
| 2026-11-05 | Draf awal `autofix.yml` memakai `git add ... \|\| true`. Bila salah satu folder belum ada, perintah gagal diam-diam dan perbaikan di folder lain tidak ikut ter-stage | Claude, saat meninjau ulang hasilnya sendiri | Stage per folder setelah mengecek keberadaannya |
