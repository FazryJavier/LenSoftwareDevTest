# Proposal

## Why

Halaman aplikasi saat ini hanya menampilkan status koneksi. US-002 (FR-2, serta BR-1, BR-2, dan BR-3) memenuhi kebutuhan utama soal: menampilkan entitas pada peta, dibedakan menurut jenis dan status.

## What Changes

- Menambah `GET /api/v1/entities` dengan parameter `bbox`, `page`, dan `per_page`, sesuai `docs/openapi.yaml`.
- Menambah peta MapLibre dengan marker per entitas, memakai ikon untuk jenis dan warna untuk status.
- Peta memuat ulang data area yang terlihat setiap kali pergerakan selesai.
- Menambah keadaan memuat, kosong, gagal dengan tombol coba lagi, dan peringatan bila data melebihi 500.
- Mengganti halaman status backend dengan halaman peta. Endpoint `/api/v1/health` tetap ada.
- Memperbarui CSP nginx agar peta dapat memuat style dan tile.

**Tidak termasuk:**

- Membuka detail saat marker dipilih (US-003). Marker sudah berupa tombol, tetapi belum melakukan apa pun.
- Tambah, ubah, dan hapus (US-004 sampai US-006).
- Parameter `type` dan `status` (US-008). Parameter yang tidak dikenal diabaikan API sampai saat itu.
- Clustering marker dan `bbox` yang melintasi antimeridian (`docs/PRD.md` §7 dan `docs/API.md`).

**Perbaikan kecil yang ikut:**

- Test integrasi harus gagal, bukan dilewati, bila berjalan di CI tanpa `TEST_DATABASE_URL`.
- Dependabot mengabaikan kenaikan TypeScript ke versi mayor, karena `typescript-eslint` belum mendukungnya.

## Capabilities

### New Capabilities

- `entity-map-view`: Menampilkan entitas tersimpan pada peta menurut area yang terlihat, beserta API daftar yang mendukungnya.

### Modified Capabilities

Tidak ada. `application-runtime` belum diarsipkan, dan perilakunya tidak berubah.

## Impact

- **Backend:** paket `domain` baru, `store/entity_store.go`, `httpapi/entity_handler.go`, `httpapi/decode.go`, dan `httpapi/dto.go`.
- **Frontend:** `features/entities/`, serta `BackendStatus` dihapus.
- **API:** endpoint baru sesuai kontrak yang sudah ada. `docs/openapi.yaml` tidak berubah kecuali bila implementasi menemukan kesalahan.
- **Database:** migrasi `00002` mengganti indeks spasial agar sesuai dengan query area. Lihat `design.md` keputusan 12.
- **Dependensi baru:** `maplibre-gl`, `@vis.gl/react-maplibre`, dan `lucide-react`, yang sudah tercatat di `docs/ITA.md`.
- **Layanan luar:** browser memuat style dan tile dari OpenFreeMap. Test tidak bergantung pada layanan itu.
