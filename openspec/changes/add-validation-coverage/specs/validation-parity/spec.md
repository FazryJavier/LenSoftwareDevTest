# Spec Delta

## Purpose

Menjamin frontend dan backend menerapkan aturan validasi yang sama, sehingga data tidak valid selalu ditolak di kedua sisi dan API selalu membalas dengan bentuk yang sama.

## ADDED Requirements

### Requirement: Frontend dan backend menerapkan aturan yang sama
Sistem SHALL memberi keputusan yang sama di frontend dan backend untuk setiap kasus validasi pada daftar bersama.

#### Scenario: Nilai melanggar aturan
- **WHEN** nilai melanggar aturan pada `docs/PRD.md` §5
- **THEN** frontend menolaknya pada field yang sama, dan backend menolaknya pada field yang sama dengan kode yang tercatat

#### Scenario: Nilai tepat di batas
- **WHEN** nilai tepat di batas, seperti latitude 90, longitude -180, koordinat 0, atau nama 100 karakter
- **THEN** frontend dan backend sama-sama menerimanya

### Requirement: Semua pelanggaran dilaporkan sekaligus
Sistem SHALL membalas request dengan banyak field salah menggunakan 422 yang memuat semua error, masing-masing dengan `field`, `code`, dan `message`.

#### Scenario: Banyak field salah
- **WHEN** request langsung ke API memuat banyak field yang salah
- **THEN** respons berstatus 422 dan memuat satu error untuk setiap pelanggaran

### Requirement: Semua kegagalan memakai envelope standar
Sistem SHALL membalas setiap kegagalan dengan envelope standar, dengan `code` sama dengan status HTTP.

#### Scenario: Request ke server yang berjalan
- **WHEN** koleksi kontrak dijalankan terhadap server untuk 400, 404, 405, 413, 415, dan 422
- **THEN** setiap respons memuat `code`, `success` false, `message`, `data` null, `errors` berisi daftar, dan `meta` null

### Requirement: Kontrak diperiksa di CI
Sistem SHALL menjalankan koleksi kontrak terhadap aplikasi Compose pada setiap Pull Request.

#### Scenario: Pull Request dibuka
- **WHEN** CI berjalan pada Pull Request
- **THEN** koleksi kontrak dijalankan, dan kegagalannya menggagalkan job `e2e`
