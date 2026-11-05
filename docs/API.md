# API

Kontrak formal ada di [openapi.yaml](openapi.yaml). Dokumen ini merangkum aturan utamanya. Bila keduanya berbeda, `openapi.yaml` yang berlaku dan perbedaannya harus diperbaiki.

Base path: `/api/v1`. API belum memakai autentikasi ([PRD §7](PRD.md#7-di-luar-ruang-lingkup)).

## Envelope

Semua respons JSON memakai bentuk berikut.

```json
{
  "code": 200,
  "success": true,
  "message": "Entity retrieved.",
  "data": {},
  "errors": null,
  "meta": null
}
```

- `code` sama dengan status HTTP.
- `errors` bernilai `null` saat sukses, dan berupa array saat gagal.
- `meta` berisi pagination pada endpoint daftar, dan `null` pada endpoint lain.
- Setiap respons membawa header `X-Request-ID`.

## Endpoint

| Method | Path | Fungsi | Sukses |
|---|---|---|---|
| `GET` | `/health` | Cek kesehatan layanan dan database | 200 |
| `GET` | `/entities` | Daftar entitas | 200 |
| `POST` | `/entities` | Membuat entitas | 201 + header `Location` |
| `GET` | `/entities/{id}` | Detail entitas | 200 |
| `PUT` | `/entities/{id}` | Mengganti seluruh data entitas | 200 |
| `DELETE` | `/entities/{id}` | Menghapus entitas | 200, `data: null` |

`DELETE` memakai 200, bukan 204, agar envelope tetap konsisten.

### Parameter `GET /entities`

| Parameter | Default | Aturan |
|---|---|---|
| `type` | semua | Satu atau lebih nilai enum, dipisah koma |
| `status` | semua | Satu atau lebih nilai enum, dipisah koma |
| `bbox` | semua | `minLng,minLat,maxLng,maxLat`; minimum harus lebih kecil dari maksimum |
| `page` | 1 | Bilangan bulat 1–1000000 |
| `per_page` | 100 | Bilangan bulat 1–500 |

Urutan hasil: `created_at` menurun, lalu `id` menurun. `bbox` yang melintasi antimeridian (garis bujur 180°) belum didukung.

### Contoh request

```json
{
  "name": "Truk Logistik 01",
  "type": "vehicle",
  "status": "active",
  "description": "Armada area Bandung",
  "attributes": { "plate_number": "D 1234 ABC" },
  "latitude": -6.9175,
  "longitude": 107.6191
}
```

### Contoh respons daftar

```json
{
  "code": 200,
  "success": true,
  "message": "Entities retrieved.",
  "data": [
    {
      "id": "0b5f6c1e-3d1a-4c55-9d58-3f0a0a2c1e11",
      "name": "Truk Logistik 01",
      "type": "vehicle",
      "status": "active",
      "description": "Armada area Bandung",
      "attributes": { "plate_number": "D 1234 ABC" },
      "latitude": -6.9175,
      "longitude": 107.6191,
      "created_at": "2026-11-05T10:00:00Z",
      "updated_at": "2026-11-05T10:00:00Z"
    }
  ],
  "errors": null,
  "meta": { "page": 1, "per_page": 100, "total": 1, "total_pages": 1 }
}
```

## Error

```json
{
  "code": 422,
  "success": false,
  "message": "Validation failed.",
  "data": null,
  "errors": [
    { "field": "latitude", "code": "out_of_range", "message": "Latitude must be between -90 and 90." }
  ],
  "meta": null
}
```

| Status | Kapan terjadi | `errors[].code` |
|---|---|---|
| 400 | JSON rusak, field tidak dikenal, query atau UUID tidak valid | `malformed_json`, `unknown_field`, `invalid_query`, `invalid_id` |
| 404 | Entitas atau rute tidak ditemukan | `not_found` |
| 405 | Method tidak didukung | `method_not_allowed` |
| 413 | Body melebihi 64 KiB. Lihat batasannya di [README](../README.md#yang-belum-selesai) | `payload_too_large` |
| 415 | `Content-Type` bukan `application/json` | `unsupported_media_type` |
| 422 | Isi valid secara JSON tetapi melanggar aturan | Kode pada [PRD §5](PRD.md#5-aturan-validasi) |
| 500 | Kesalahan internal | `internal_error` |
| 503 | Database tidak dapat dijangkau pada `/health` | `unavailable` |

Pesan 500 dan 503 tidak boleh memuat SQL, stack trace, atau detail internal. Detailnya hanya ditulis ke log bersama request ID.

`field` berisi path JSON, misalnya `attributes.plate_number`. Field ini bernilai `null` untuk error yang tidak terkait field tertentu.

## Validasi kontrak

```bash
npx --yes @redocly/cli@2.76.0 lint docs/openapi.yaml
```

Koleksi di `postman/` menguji alur CRUD dan semua jenis kegagalan terhadap server yang berjalan. CI menjalankannya pada aplikasi Compose lewat Newman. Di lokal, jalankan salah satu perintah berikut.

```bash
npx --yes newman@6.2.3 run postman/geoentity.postman_collection.json --env-var baseUrl=http://localhost:8080/api/v1
```

```bash
postman collection run postman/geoentity.postman_collection.json --env-var baseUrl=http://localhost:8080/api/v1
```
