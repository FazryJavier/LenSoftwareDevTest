# Spec Delta

## ADDED Requirements

### Requirement: Marker terpilih dapat dibedakan
Sistem SHALL menampilkan marker entitas terpilih secara berbeda dari marker lain, dan menandainya bagi pembaca layar.

#### Scenario: Marker dipilih
- **WHEN** pengguna memilih marker
- **THEN** marker itu tampil lebih besar dengan cincin warna utama, dan memiliki `aria-pressed` bernilai true
