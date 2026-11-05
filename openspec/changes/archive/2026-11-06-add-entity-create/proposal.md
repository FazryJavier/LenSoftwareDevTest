# Proposal

## Why

Saat ini entitas hanya dapat dilihat. US-004 (FR-4, FR-7, BR-4, BR-6) memungkinkan operator menambah entitas dengan memilih titik di peta, dan membangun validasi frontend serta backend yang diwajibkan soal.

## What Changes

- Menambah `POST /api/v1/entities` dengan validasi sesuai `docs/PRD.md` §5, membalas 201 beserta header `Location`.
- Menangani body rusak (400), field tidak dikenal (400), `Content-Type` salah (415), body terlalu besar (413), dan data tidak valid (422).
- Menambah tombol Tambah, form entitas pada panel, marker sementara, dan pengisian koordinat lewat klik peta atau ketikan.
- Menampilkan error per field dari frontend dan dari respons server, serta pesan sukses.
- Menambah konfirmasi saat membatalkan form yang sudah berisi perubahan.
- Menambah ajakan menambah entitas pada keadaan kosong, yang ditunda dari US-002.
- Menambah komponen dasar `Button`, `Field`, `Select`, `Dialog`, dan `Toast`.

**Tidak termasuk:**

- Mengubah entitas (US-005), walau form dirancang agar dapat dipakai ulang.
- Menghapus entitas (US-006). Sampai saat itu, test E2E meninggalkan data pada database lokal.
- Pengujian silang seluruh aturan validasi dan koleksi Postman (US-007).
- Idempotency key (`docs/PRD.md` §7). Tombol simpan dinonaktifkan selama request berjalan.

## Capabilities

### New Capabilities

- `entity-create`: Membuat entitas dari peta, beserta validasi input di frontend dan backend.

### Modified Capabilities

- `entity-map-view`: Keadaan kosong kini mengajak pengguna menambah entitas, dan peta dapat dipakai memilih titik.

## Impact

- **Backend:** `domain/validate.go`, `EntityInput`, decoder JSON dengan batas body, `EntityStore.Create`, serta handler dan rute baru.
- **Frontend:** `EntityForm`, komponen dasar UI, mutation `useCreateEntity`, serta perubahan pada `EntitiesPage` dan `EntityMap`.
- **API:** endpoint baru sesuai kontrak yang sudah ada.
- **Database:** tidak ada perubahan skema.
- **Dependensi baru:** `react-hook-form` dan `@hookform/resolvers`, yang sudah tercatat di `docs/ITA.md`.
