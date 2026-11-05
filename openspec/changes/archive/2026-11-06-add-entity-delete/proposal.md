# Proposal

## Why

Entitas yang tidak lagi dipakai belum dapat dihapus. US-006 (FR-6, BR-4) melengkapi kebutuhan pengelolaan pada soal.

## What Changes

- Menambah `DELETE /api/v1/entities/{id}`, sesuai `docs/openapi.yaml`.
- Menambah tombol Hapus pada panel detail, dengan dialog konfirmasi yang menyebut nama entitas.
- Setelah dihapus, marker hilang, panel tertutup, dan pesan sukses muncul.
- Test E2E kini menghapus data ujinya sendiri.

**Tidak termasuk:**

- Soft delete atau pemulihan. Penghapusan bersifat permanen, sesuai US-006.
- Menghapus banyak entitas sekaligus.

## Capabilities

### New Capabilities

- `entity-delete`: Menghapus entitas secara permanen dari peta, setelah konfirmasi.

### Modified Capabilities

Tidak ada.

## Impact

- **Backend:** `EntityStore.Delete`, serta handler dan rute baru.
- **Frontend:** `deleteEntity`, `useDeleteEntity`, `DeleteEntityDialog`, dan tombol Hapus.
- **API:** endpoint baru sesuai kontrak yang sudah ada.
- **Database:** tidak ada perubahan skema.
- **Dependensi:** tidak ada yang baru.
- **Persetujuan:** pemilik proyek menyetujui US-006 sampai US-008 sekaligus pada 6 November 2026.
