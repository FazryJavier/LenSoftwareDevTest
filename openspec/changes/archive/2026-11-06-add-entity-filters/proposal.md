# Proposal

## Why

Pada area yang padat, operator perlu fokus pada objek tertentu. US-008 (FR-8, BR-2) menambah filter jenis dan status pada peta.

## What Changes

- Menambah parameter `type` dan `status` pada `GET /api/v1/entities`, sesuai `docs/openapi.yaml`. Keduanya menerima satu atau lebih nilai, dipisah koma.
- Menambah pilihan Jenis dan Status pada header, serta tombol Reset saat filter aktif.
- Menyimpan filter di URL, sehingga bertahan saat dimuat ulang dan dapat dibagikan.
- Pesan kosong membedakan area tanpa entitas dari filter yang tidak cocok.

**Tidak termasuk:**

- Memilih beberapa nilai sekaligus di UI. API mendukungnya, tetapi UI cukup satu pilihan per filter sesuai `docs/PROTOTYPE.md`.
- Pencarian berdasarkan nama.

## Capabilities

### New Capabilities

- `entity-filters`: Membatasi entitas pada peta menurut jenis dan status.

### Modified Capabilities

Tidak ada. Perilaku tanpa filter tidak berubah.

## Impact

- **Backend:** `ListFilter`, parsing query, dan penyusunan kondisi pada `EntityStore.List`.
- **Frontend:** `EntityFilters`, `useEntityFilters`, serta `listEntities` dan `useEntities` menerima filter.
- **API:** memakai parameter yang sudah ada di kontrak.
- **Database:** tidak ada perubahan skema. Indeks `(type, status)` sudah tersedia.
- **Dependensi:** tidak ada yang baru.
- **Persetujuan:** pemilik proyek menyetujui US-006 sampai US-008 sekaligus pada 6 November 2026.
