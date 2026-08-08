# PRD: Core Shared Services (Layanan Lintas Modul)

## 1. Deskripsi
Dokumen ini mencakup layanan/infrastruktur yang dibutuhkan oleh **lebih dari satu modul HR** sehingga dibangun sekali sebagai layanan bersama, bukan diimplementasikan berulang secara terpisah di tiap modul. Ini bukan modul fitur bisnis, melainkan fondasi teknis yang mendukung modul-modul lain.

## 2. Kenapa Ini Perlu Ada Sebagai Dokumen Terpisah
Beberapa kebutuhan berikut disebutkan implisit di beberapa PRD modul (Leave, Overtime, Shift, Recruitment, Asset, Performance) tapi tidak punya "rumah" yang jelas di roadmap awal. Jika dibangun sendiri-sendiri per modul, hasilnya inkonsisten dan sulit dipelihara.

## 3. Cakupan Layanan

### a. Kalender Hari Libur & Cuti Bersama
- **Digunakan oleh**: Leave, Overtime (formula lembur hari libur), Shift Management (roster).
- **Kebutuhan**: tabel `national_holidays` (tanggal, nama, tipe: libur nasional/cuti bersama), dapat dikelola per tahun oleh HR/Admin, idealnya bisa impor dari kalender resmi pemerintah setiap tahun.

### b. Layanan Notifikasi (Push & Email)
- **Digunakan oleh**: Leave (approval), Overtime (approval), Shift (jadwal & tukar shift), Recruitment (jadwal wawancara), Asset (reminder pengembalian), Performance (jendela penilaian).
- **Kebutuhan**: satu service terpusat yang menerima event (`leave.submitted`, `shift.swap_requested`, dst) dan mengirim notifikasi sesuai channel yang dikonfigurasi (push mobile via FCM/Expo Notifications, dan/atau email). Modul lain cukup memicu event, tidak perlu implementasi pengiriman sendiri-sendiri.

### c. Audit Log
- **Digunakan oleh**: seluruh modul, terutama Payroll, Employee Contracts, Performance (data sensitif).
- **Kebutuhan**: tabel `audit_logs` generik (actor_id, aksi, entitas, entitas_id, data_sebelum, data_sesudah, timestamp) yang dicatat otomatis lewat model event Laravel (observer), bukan ditulis manual di tiap controller — supaya konsisten dan tidak ada modul yang lupa mencatat.

### d. Kepatuhan Data Pribadi (UU PDP)
- **Digunakan oleh**: Attendance (data wajah), Payroll (data finansial), Recruitment (data pelamar), Performance (data penilaian).
- **Kebutuhan**:
  - Mekanisme persetujuan eksplisit (consent) yang dapat dilacak per karyawan/kandidat, khususnya untuk data biometrik.
  - Kebijakan retensi data per kategori (foto wajah, dokumen pelamar, dll) dengan proses penghapusan/anonimisasi otomatis setelah masa retensi berakhir.
  - Kontrol akses berbasis peran (RBAC via Spatie) yang konsisten diterapkan di semua modul yang menyentuh data pribadi.

### e. Object Storage Terpusat
- **Digunakan oleh**: Attendance (foto selfie), Leave (surat dokter), Recruitment (CV), Asset (foto kondisi barang), Performance (dokumen pendukung).
- **Kebutuhan**: satu konfigurasi storage (S3-compatible/MinIO) dengan enkripsi at-rest, dipakai bersama oleh semua modul, alih-alih tiap modul menyimpan file secara lokal dengan cara berbeda-beda.

### f. Dokumentasi API (OpenAPI/Swagger)
- **Kebutuhan**: karena backend Laravel dikonsumsi oleh dua frontend terpisah (Vue Admin & React Native mobile) yang dikembangkan mungkin oleh tim/waktu berbeda, dokumentasi API terpusat mencegah miskomunikasi kontrak data antar tim.

### g. Pertimbangan Multi-Tenant
- Jika ada kemungkinan sistem ini akan dipakai lebih dari satu perusahaan/cabang dengan data terpisah di masa depan, keputusan arsitektur (single database dengan `company_id` di setiap tabel, vs database terpisah per tenant) **sebaiknya diputuskan sebelum Sprint 1**, karena mengubahnya setelah banyak modul berjalan akan sangat mahal.

## 4. Rekomendasi Waktu Implementasi
- **Kalender hari libur, Object Storage, Audit Log**: bangun di Sprint 1-2 (bersamaan dengan HR Core & Attendance), karena modul-modul awal sudah membutuhkannya.
- **Layanan Notifikasi**: bangun sebelum Sprint 5 (Leave & Shift), karena kedua modul itu sangat bergantung pada approval workflow yang butuh notifikasi.
- **Kebijakan PDP & retensi data**: sebaiknya diformalkan sebagai kebijakan tertulis sebelum Sprint 4 (Face Recognition), karena menyangkut data biometrik yang paling sensitif.
- **Keputusan multi-tenant**: sebelum Sprint 1 dimulai.

## 5. Kriteria Sukses
- Tidak ada modul yang membangun ulang logika notifikasi/audit log/storage sendiri.
- Kebijakan retensi data terdokumentasi dan diterapkan secara otomatis, bukan manual.