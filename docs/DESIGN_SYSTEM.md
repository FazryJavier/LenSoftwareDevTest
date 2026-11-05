# Design System

Tampilan dibuat untuk alat operasional: tenang, padat informasi, dan membiarkan peta menjadi fokus. Aplikasi hanya memiliki tema terang.

## 1. Token warna

Token didefinisikan sekali pada blok `@theme` Tailwind di `frontend/src/index.css`. Warna heksadesimal tidak boleh ditulis langsung di komponen.

| Token | Nilai | Pemakaian |
|---|---|---|
| `--color-surface` | `#FFFFFF` | Panel dan kartu |
| `--color-surface-muted` | `#F3F4F6` | Latar sekunder |
| `--color-border` | `#D1D5DB` | Garis pemisah dan input |
| `--color-text` | `#111827` | Teks utama |
| `--color-text-muted` | `#4B5563` | Label dan teks sekunder |
| `--color-primary` | `#1D4ED8` | Aksi utama dan fokus |
| `--color-danger` | `#B91C1C` | Hapus dan error |
| `--color-status-active` | `#15803D` | Status aktif |
| `--color-status-maintenance` | `#B45309` | Status pemeliharaan |
| `--color-status-inactive` | `#4B5563` | Status nonaktif |

Warna teks dan status di atas memiliki kontras minimal 4.5:1 terhadap latar putih (WCAG AA).

## 2. Tipografi

Font memakai system font stack sehingga tidak ada unduhan font.

| Peran | Ukuran | Tebal |
|---|---|---|
| Judul panel | 18 px | 600 |
| Isi | 14 px | 400 |
| Label | 12 px | 500 |

Koordinat memakai font monospace dengan 5 digit desimal.

## 3. Jarak dan bentuk

- Skala jarak Tailwind: 1, 2, 3, 4, dan 6.
- Radius: 6 px untuk input dan tombol, 8 px untuk panel dan dialog.
- Bayangan hanya dipakai pada elemen yang melayang di atas peta.
- Lebar panel samping: 360 px pada desktop.

## 4. Marker

Marker menggabungkan **ikon** untuk jenis dan **warna** untuk status, sehingga informasinya tidak bergantung pada warna saja.

| Jenis | Ikon Lucide | Label |
|---|---|---|
| `vehicle` | `Truck` | Kendaraan |
| `iot_device` | `Cpu` | Perangkat IoT |
| `facility` | `Building2` | Fasilitas |
| `other` | `MapPin` | Lainnya |

| Status | Warna | Label |
|---|---|---|
| `active` | `--color-status-active` | Aktif |
| `maintenance` | `--color-status-maintenance` | Pemeliharaan |
| `inactive` | `--color-status-inactive` | Nonaktif |

| Keadaan marker | Tampilan |
|---|---|
| Normal | Lingkaran 32 px dengan ikon putih dan garis tepi putih |
| Terpilih | Ukuran 40 px dan cincin `--color-primary` |
| Sementara (form) | Garis tepi putus-putus, dapat digeser saat mode ubah |

Marker berupa `<button>` dengan `aria-label`, misalnya "Truk Logistik 01, Kendaraan, Aktif".

## 5. Komponen dasar

| Komponen | Varian atau keadaan |
|---|---|
| `Button` | `primary`, `secondary`, `danger`; `disabled`, `loading` |
| `Field` | Label, input, teks bantuan, pesan error |
| `Select` | Memakai `<select>` native |
| `Badge` | Warna status beserta teks |
| `Dialog` | Elemen `<dialog>` native untuk konfirmasi |
| `Toast` | Sukses atau error; `role="status"` atau `role="alert"` |
| `Banner` | Pesan error dan peringatan di atas peta |

## 6. Aksesibilitas

- Fokus keyboard selalu terlihat dengan cincin `--color-primary`.
- Setiap input memiliki `<label>`, dan error dihubungkan melalui `aria-describedby`.
- `Esc` menutup panel atau dialog, dan fokus kembali ke elemen pemicu.
- Lokasi dapat diisi lewat input koordinat, sehingga form tetap dapat dipakai tanpa mouse.
- Animasi dinonaktifkan bila `prefers-reduced-motion` aktif.

## 7. Bahasa antarmuka

UI memakai Bahasa Indonesia. Pesan error API memakai Bahasa Inggris sebagai kontrak; frontend menerjemahkan berdasarkan `code` dan memakai `message` sebagai cadangan.
