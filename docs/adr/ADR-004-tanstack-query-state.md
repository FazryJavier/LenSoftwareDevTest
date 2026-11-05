# ADR-004: TanStack Query tanpa global state store

**Status:** Diterima

## Konteks

Hampir semua state berasal dari server. State murni di sisi klien hanya berupa entitas terpilih, mode panel, dan filter.

## Keputusan

Memakai TanStack Query untuk server state, React Hook Form untuk form, `useState` untuk UI lokal, dan URL search params untuk filter.

## Konsekuensi

- Cache, status loading, refetch, dan invalidasi tersedia tanpa kode tambahan.
- Filter tetap ada saat halaman dimuat ulang dan dapat dibagikan lewat URL.
- Tidak ada Redux atau Zustand. Bila state klien lintas halaman bertambah banyak, keputusan ini perlu ditinjau ulang.
