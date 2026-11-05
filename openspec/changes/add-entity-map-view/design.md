# Design

## Context

US-001 sudah menyediakan server, envelope, migrasi tabel `entities`, klien API, dan Compose. Kontrak ada di `docs/openapi.yaml`, query dasar ada di `docs/DATABASE.md`, dan tampilan marker ada di `docs/DESIGN_SYSTEM.md`. Dokumen ini hanya mencatat keputusan yang belum tercakup di sana.

## Goals / Non-Goals

**Goals:**

- Menetapkan pola baca yang akan dipakai US-003 sampai US-008: `domain → store → httpapi` dan `schema → api → hooks → komponen`.
- Membuktikan peta nyata berjalan di browser dan di bawah CSP nginx.

**Non-Goals:**

- Membuat kerangka untuk operasi tulis.
- Mengoptimalkan peta melebihi batas 500 marker pada NFR-8.

## Decisions

**1. Marker berupa elemen DOM lewat komponen `Marker`.** Elemen DOM mudah dibuat menjadi `<button>` berlabel, mudah diuji Playwright, dan mudah diberi ikon Lucide. *Alternatif:* symbol layer WebGL. Lebih cepat untuk ribuan titik, tetapi tidak dapat diakses keyboard dan batas 500 tidak membutuhkannya.

**2. `bbox` dikirim setelah `onMoveEnd`, dengan debounce 300 ms.** TanStack Query memakai `placeholderData: keepPreviousData`, sehingga marker lama tetap tampil saat data baru dimuat. Query key memuat `bbox`, sehingga respons lama tidak menimpa area baru.

**3. Batas peta di-clamp ke rentang koordinat sebelum dikirim.** Pada zoom rendah, `getBounds()` dapat melewati ±180. Longitude dan latitude dibatasi ke rentang yang sah, dan peta memakai `renderWorldCopies: false`. Akibatnya `bbox` selalu valid dan tidak perlu menangani antimeridian. Fungsi ini murni dan diuji sendiri.

**4. Peta awal memuat seluruh Indonesia lewat `bounds`.** Rencana awal memakai pusat dan zoom tetap, tetapi pada layar sempit area itu tidak mencakup Pulau Jawa, sehingga data contoh tidak tampil. `bounds` menyesuaikan zoom dengan ukuran layar.

**5. CSP nginx mengizinkan `https:` untuk `connect-src` dan `img-src`, serta `'self'` dan `blob:` untuk worker.** `VITE_MAP_STYLE_URL` dapat diganti, sehingga daftar host tetap akan merusak konfigurasi itu. Trade-off ini diterima karena halaman tidak merender HTML dari data pengguna. MapLibre 6 memuat worker dari file sendiri, sehingga `'self'` diperlukan. `style-src` tetap ketat, dan kecukupannya dibuktikan lewat test E2E di belakang nginx.

**6. E2E memakai fixture untuk API dan style pada test marker.** `POST` baru tersedia pada US-004, dan test tidak boleh membuat data lewat SQL atau bergantung pada internet. Playwright mencegat `/api/v1/entities` dan URL style, sehingga marker, label, dan peringatan batas diuji di browser sungguhan. API sungguhan dibuktikan lewat test integrasi dan satu test E2E yang memanggil endpoint lewat nginx. Kriteria US-002 tentang E2E diselaraskan, dan alur penuh dengan data sungguhan diuji mulai US-004.

**7. Komponen peta di-mock pada Vitest.** jsdom tidak memiliki WebGL. `EntityMap` dibuat tipis, sedangkan pengambilan data, keadaan, dan `bbox` berada di hook dan fungsi yang dapat diuji tanpa peta.

**8. `description` kosong dikirim sebagai `null`, dan `attributes` kosong sebagai `{}`.** Kolom `description` bernilai NULL, sedangkan kontrak mewajibkan kedua field selalu ada.

**9. Daftar memakai dua query: `COUNT(*)` lalu `SELECT`.** Lebih mudah dibaca daripada window function pada skala ini. Keduanya tidak dibungkus transaksi, sehingga `total` dapat sedikit berbeda dari data saat ada penulisan bersamaan. Ini dapat diterima untuk peta.

**10. `store` menerima interface `DBTX`.** Test integrasi menjalankan query di dalam transaksi yang di-rollback, sesuai aturan `CLAUDE.md`.

**11. `/health` tidak lagi dipakai halaman.** `BackendStatus` dihapus, karena kegagalan API kini tampil pada banner peta. Test E2E status backend diganti.

**12. Filter area memakai `ST_Intersects` pada `location::geometry`, ditambah migrasi `00002`.** Rancangan awal memakai `&&` pada `geography`, yang membandingkan kotak 3D geosentris dan bukan persegi bujur-lintang, sehingga salah untuk area luas. Indeks geography diganti indeks ekspresi pada geometry, karena belum ada query jarak yang memakainya. Proposal awal menyatakan tidak ada migrasi baru, dan keputusan ini mengoreksinya.

**13. `optimizeDeps.exclude` untuk `maplibre-gl`.** Pre-bundling Vite memindahkan MapLibre tanpa file worker-nya, sehingga peta dasar kosong pada dev server. Marker tetap tampil, sehingga masalah ini tidak terlihat oleh test marker saja. Test E2E kini gagal bila worker tidak termuat.

**14. `API_PROXY_TARGET` pada dev server.** Target proxy Vite dapat diganti, agar frontend tetap dapat dipakai bila backend berjalan di port lain.

## Risks / Trade-offs

- [WebGL tidak tersedia di runner CI] → Chromium Playwright memakai software rendering. Bila gagal, marker tidak dapat diuji di CI, dan kita harus menyesuaikan argumen peluncuran atau mencatat batasannya.
- [Layanan OpenFreeMap tidak tersedia] → Marker dan pesan tetap berfungsi, dan URL dapat diganti. Peta dasar kosong.
- [`bbox` berubah cepat saat peta digeser] → Debounce dan query key mencegah respons lama ditampilkan.
- [Ratusan marker DOM memperlambat peta] → NFR-8 dibatasi 500, dan peringatan batas meminta pengguna memperbesar peta. Performa pada 500 marker diperiksa manual.
- [Pemeriksaan visual peta sungguhan butuh tile dari internet] → Dilakukan manual pada jalur lokal, dan hasilnya dicatat.

## Migration Plan

Tidak ada migrasi data. Rollback berarti tidak menggabungkan branch ini.
