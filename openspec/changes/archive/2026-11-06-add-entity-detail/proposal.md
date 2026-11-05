# Proposal

## Why

Marker sudah tampil di peta, tetapi belum dapat dipilih. US-003 (FR-3, BR-5) memenuhi kebutuhan soal untuk melihat detail entitas pada peta.

## What Changes

- Menambah `GET /api/v1/entities/{id}`, sesuai `docs/openapi.yaml`.
- Memilih marker membuka panel detail berisi nama, jenis, status, deskripsi, atribut, koordinat, serta waktu dibuat dan diperbarui.
- Marker terpilih tampil lebih besar dan bercincin, sesuai `docs/DESIGN_SYSTEM.md`.
- Panel ditutup dengan tombol tutup atau `Esc`, dan fokus keyboard kembali ke marker.
- Menambah keadaan memuat, gagal dengan coba lagi, dan tidak ditemukan pada panel.

**Tidak termasuk:**

- Tombol Ubah dan Hapus pada panel (US-005 dan US-006).
- Mengubah URL saat entitas dipilih, sehingga detail tidak dapat dibagikan lewat tautan.
- Clustering atau daftar untuk memilih marker yang bertumpuk.

**Pembaruan dokumen yang ikut:**

- Aturan merge terbaru pada `CLAUDE.md` dan `docs/WORKFLOW.md`, serta proteksi `main`.
- Status dan bukti CI US-002.

## Capabilities

### New Capabilities

- `entity-detail`: Melihat informasi lengkap satu entitas dari peta, beserta API yang mendukungnya.

### Modified Capabilities

- `entity-map-view`: Marker kini dapat dipilih dan menampilkan keadaan terpilih.

## Impact

- **Backend:** `domain/errors.go`, `EntityStore.Get`, serta handler dan rute baru.
- **Frontend:** `EntityDetailPanel.tsx`, `getEntity`, `useEntity`, serta perubahan pada `EntityMarker`, `EntityMap`, dan `EntitiesPage`.
- **API:** endpoint baru sesuai kontrak yang sudah ada.
- **Database:** tidak ada perubahan.
- **Dependensi:** tidak ada yang baru.
