# ADR-001: MapLibre GL JS dan OpenFreeMap untuk peta

**Status:** Diterima

## Konteks

Peta adalah inti aplikasi. Reviewer harus dapat menjalankan aplikasi tanpa membuat akun atau API key.

## Keputusan

Memakai `maplibre-gl` melalui `@vis.gl/react-maplibre`, dengan style OpenFreeMap sebagai default. URL style dapat diganti lewat `VITE_MAP_STYLE_URL`.

## Konsekuensi

- Tidak ada token, biaya, atau konfigurasi tambahan bagi reviewer.
- Tile bergantung pada layanan pihak ketiga. Bila layanan turun, peta dasar kosong, tetapi API dan form tetap berjalan.
- Atribusi OpenFreeMap dan OpenStreetMap wajib tetap tampil.
- Tes unit tidak menjalankan WebGL, sehingga komponen peta perlu di-mock. Interaksi peta nyata diuji dengan Playwright.

## Alternatif

- **Mapbox dan Google Maps:** membutuhkan token atau akun penagihan.
- **Leaflet:** sederhana, tetapi berbasis DOM dan kurang lancar untuk banyak marker.
