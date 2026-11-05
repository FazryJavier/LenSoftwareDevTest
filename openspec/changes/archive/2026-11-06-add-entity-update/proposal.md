# Proposal

## Why

Entitas yang sudah tersimpan belum dapat diperbaiki. US-005 (FR-5, FR-7, BR-4) memungkinkan operator mengubah data dan lokasi entitas, sesuai kebutuhan soal.

## What Changes

- Menambah `PUT /api/v1/entities/{id}` yang mengganti seluruh data entitas, dengan validasi dan penanganan request yang sama seperti `POST`.
- Menambah tombol Ubah pada panel detail, yang membuka form berisi data entitas saat ini.
- Lokasi dapat diubah dengan klik peta, mengetik koordinat, atau menggeser marker.
- Batal mengembalikan panel ke detail, dan marker kembali ke posisi semula.
- Setelah disimpan, marker dan detail diperbarui, serta pesan sukses muncul.

**Tidak termasuk:**

- Optimistic concurrency. Pada perubahan bersamaan, penulis terakhir yang menang (`docs/PRD.md` §7).
- `PATCH` atau perubahan sebagian. Semua field wajib dikirim, sesuai kontrak.
- Menghapus entitas (US-006).

## Capabilities

### New Capabilities

- `entity-update`: Mengubah data dan lokasi entitas yang sudah ada dari peta.

### Modified Capabilities

Tidak ada. Perubahan pada form dan panel adalah implementasi, dan perilaku pada `entity-detail` serta `entity-map-view` tetap berlaku.

## Impact

- **Backend:** `EntityStore.Update`, serta handler dan rute baru.
- **Frontend:** `updateEntity`, `useUpdateEntity`, mode `edit` pada panel, `EntityForm` untuk dua mode, serta marker yang dapat digeser.
- **API:** endpoint baru sesuai kontrak yang sudah ada.
- **Database:** tidak ada perubahan skema.
- **Dependensi:** tidak ada yang baru.
