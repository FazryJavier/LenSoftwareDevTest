# Changelog

Semua perubahan pada proyek ini dicatat di sini, dengan entri terbaru di atas, agar setiap fitur dapat ditelusuri: apa yang berubah, bagaimana caranya, dan bagaimana membuktikannya. Aturan pengisiannya ada di [CLAUDE.md](CLAUDE.md#changelog).

Status saat ini: belum ada kode aplikasi. Semua entri di bawah adalah dokumen dan konfigurasi.

## 2026-11-06

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
