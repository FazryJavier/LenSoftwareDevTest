# Design

## Context

Repository belum memiliki kode aplikasi. Struktur file, aturan, dan pilihan library sudah ditetapkan di `CLAUDE.md`, `docs/ARCHITECTURE.md`, dan `docs/ITA.md`, sehingga dokumen ini hanya mencatat keputusan yang belum tercakup di sana.

Kondisi saat ini: Docker daemon di mesin pengembangan sedang mati, dan `golangci-lint` belum terpasang.

## Goals / Non-Goals

**Goals:**

- Membuktikan kombinasi versi pada `docs/ITA.md` §3 lewat instalasi dan build sungguhan.
- Menyediakan pola backend dan frontend yang tinggal diikuti oleh US berikutnya.
- Membuat aturan `CLAUDE.md` diperiksa otomatis oleh tooling.

**Non-Goals:**

- Membuat kerangka kosong untuk fitur berikutnya. File seperti `entity_store.go` dan `EntityForm.tsx` dibuat saat dibutuhkan.
- Mengoptimalkan ukuran image di luar multi-stage build.

## Decisions

**1. Migrasi dijalankan saat start, dan kegagalannya menghentikan proses.** Goose memakai `database/sql`, sehingga migrasi berjalan lewat `pgx/v5/stdlib`, sedangkan aplikasi memakai `pgxpool`. Compose menunggu database sehat lewat `depends_on: condition: service_healthy`. *Alternatif:* job migrasi terpisah. Ditolak karena menambah layanan tanpa manfaat pada satu instance.

**2. Start backend tanpa retry koneksi.** `depends_on` dan `restart: on-failure` sudah menangani urutan start. Setelah berjalan, database yang mati dilaporkan `/health` sebagai 503. *Alternatif:* loop retry di kode. Ditolak karena menambah logika untuk keadaan yang sudah ditangani Compose.

**3. `/health` memakai `Ping` dengan timeout 2 detik.** Handler bergantung pada interface kecil `HealthChecker`, sehingga kondisi sehat dan tidak sehat dapat diuji tanpa database. Error asli hanya masuk log.

**4. Respons 404 dan 405 dari `ServeMux` diubah menjadi envelope.** `ServeMux` menulis teks biasa untuk keduanya. `mux.Handler(r)` mengembalikan pattern kosong hanya bila tidak ada rute yang cocok, sehingga jalur fallback dapat dijalankan pada writer sementara untuk mengetahui statusnya, lalu envelope ditulis sambil mempertahankan header `Allow`. Respons dari handler sungguhan tidak pernah melewati jalur ini, dan redirect perapian path tetap berjalan. Perilakunya dikunci dengan test. Rencana awal membungkus `ResponseWriter` diganti karena memerlukan penanda khusus pada handler. *Alternatif:* router pihak ketiga. Ditolak oleh ADR-003.

**5. Image backend memakai Alpine dengan user non-root.** Compose healthcheck membutuhkan `wget`, yang tersedia di Alpine. *Alternatif:* distroless dengan subcommand healthcheck. Ditolak karena menambah kode hanya untuk healthcheck.

**6. Frontend disajikan `nginxinc/nginx-unprivileged`.** Image ini berjalan non-root dan meneruskan `/api/` ke backend, sehingga browser hanya berkomunikasi dengan satu origin. Tag dipilih dan dikunci saat implementasi. `VITE_MAP_STYLE_URL` diteruskan sebagai build arg.

**7. Halaman awal memanggil `/health`.** Ini satu-satunya perilaku frontend pada change ini. Tujuannya membuktikan alur browser → nginx → backend → database, dan menjadi contoh pola `api/client.ts` serta TanStack Query.

**8. Database test dibuat lewat `db/init/01-create-test-db.sql`.** Script `docker-entrypoint-initdb.d` hanya berjalan pada volume baru. Mesin dengan volume lama harus membuatnya manual, dan perintahnya ditulis di `docs/GUIDE.md`. File di-mount satu per satu, karena entrypoint mengabaikan subfolder dan mount seluruh folder akan menutupi script PostGIS bawaan image.

**12. Jalur tanpa Docker memakai `db/local/setup.sql`.** Docker Desktop gagal berjalan di mesin pengembangan, sehingga kode dibuktikan terhadap PostgreSQL 18 dan PostGIS 3.6 yang terpasang langsung. Role `geo` bukan superuser, sehingga ekstensi dibuat lebih dulu oleh superuser. Jalur Compose tetap menjadi jalur utama penilai dan dibuktikan oleh CI.

**13. Port database di host memakai 5433.** Port 5432 sudah dipakai PostgreSQL lokal di mesin pengembangan, dan hal yang sama mungkin terjadi di mesin penilai.

**14. Urutan middleware: request ID → log → recover → security headers → CORS.** Recover berada di dalam log, agar panic tetap tercatat bersama request ID dan status 500. Batas ukuran body dibuat bersama endpoint pertama yang menerima body, yaitu pada US-004.

**9. Test migrasi memastikan hasil akhir.** Sesuai aturan `CLAUDE.md`, test tidak menghapus apa pun. Test menjalankan migrasi pada database `_test`, lalu memeriksa keberadaan tabel dan indeks, serta bahwa menjalankannya dua kali tetap berhasil. Kondisi database yang benar-benar kosong dibuktikan oleh CI dan oleh pemeriksaan manual dengan volume baru.

**10. Seed dijalankan manual lewat `psql`.** `backend/seed/seed.sql` memakai UUID tetap dan `ON CONFLICT DO NOTHING`, sehingga aman dijalankan berulang dan tidak pernah berjalan otomatis. Reviewer yang tidak menjalankan seed akan melihat keadaan kosong.

**11. `golangci-lint` dijalankan lewat `go run ...@v2.15.0` di lokal.** Versinya sama dengan CI dan tidak memerlukan pemasangan global.

## Risks / Trade-offs

- [Kombinasi versi terbaru ternyata tidak kompatibel] → Dibuktikan paling awal. Bila gagal, turunkan versi yang bermasalah, lalu catat di `docs/ITA.md` dan `docs/issue/`.
- [Penulisan ulang 404 dan 405 menangkap respons yang salah] → Test mencakup 404 dari mux, 405 dari mux, dan 404 yang ditulis handler dengan envelope sendiri.
- [Migrasi `geography` berperilaku berbeda dari rancangan] → Dibuktikan oleh test integrasi. Perbedaannya diperbaiki di `docs/DATABASE.md`.
- [`go test -race` memerlukan cgo di Windows] → Bila tidak tersedia di lokal, jalankan tanpa `-race` dan laporkan. CI Linux tetap menjalankan `-race`.
- [Image PostGIS hanya amd64] → `platform: linux/amd64` pada Compose. Pada mesin ARM akan lebih lambat, dan belum diuji di mesin ARM.
- [Docker Desktop gagal berjalan di mesin pengembangan] → Kode dibuktikan lewat jalur tanpa Docker. Dockerfile dan Compose hanya dibuktikan oleh job `e2e` di CI, sehingga task kelompok 4 tetap terbuka sampai ada bukti.
- [Versi lokal berbeda dari Compose: PostgreSQL 18 dan PostGIS 3.6 berbanding 17 dan 3.7] → CI memakai versi yang sama dengan Compose.
- [`SIGTERM` tidak dapat dikirim dengan cara yang sama di Windows] → Graceful shutdown belum dibuktikan di lokal, dan perlu diperiksa saat Compose berjalan.

## Migration Plan

Tidak ada data lama. Rollback berarti tidak menggabungkan branch ini.
