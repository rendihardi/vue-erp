# PRD: Overtime (Lembur)

## 1. Deskripsi
Modul pengajuan pra-lembur dan klaim pasca-lembur oleh karyawan, dengan validasi kesesuaian waktu lembur terhadap log absensi aktual, serta kalkulasi otomatis upah lembur sesuai regulasi ketenagakerjaan (Depnaker).

## 2. Tujuan
- Memastikan lembur yang dibayarkan benar-benar terjadi (tervalidasi oleh data absensi aktual), bukan sekadar klaim.
- Mengotomatisasi kalkulasi upah lembur agar sesuai regulasi dan konsisten antar karyawan.

## 3. Fitur Utama
- Pengajuan pra-lembur (rencana lembur sebelum terjadi, disetujui oleh HR Admin).
- Klaim pasca-lembur (setelah lembur dilakukan, karyawan mengonfirmasi durasi aktual).
- Validasi otomatis: waktu klaim lembur dicocokkan dengan `attendance_logs` (jam check-out aktual).
- Kalkulasi upah lembur otomatis berdasarkan formula regulasi (jam ke-1, jam ke-2 dst, hari kerja vs libur/akhir pekan).
- Riwayat lembur per karyawan dan laporan rekap lembur untuk HR.

## 4. Alur Proses (Ringkas)
1. Karyawan mengajukan rencana lembur (opsional, tergantung kebijakan perusahaan — disetujui langsung oleh HR Admin).
2. HR Admin menyetujui rencana lembur.
3. Karyawan check-out melalui modul Attendance seperti biasa.
4. Karyawan mengklaim lembur dengan durasi aktual.
5. Sistem membandingkan waktu klaim dengan `attendance_logs`; jika selisih melebihi toleransi, klaim ditandai untuk review manual HR (bukan otomatis ditolak).
6. Setelah disetujui, data lembur masuk sebagai komponen ke Payroll.

## 5. Kebutuhan Data / Skema Utama
- `overtimes`: employee_id, overtime_date, planned_hours (pra-lembur), claimed_hours (pasca-lembur), validated_hours (hasil cocok dengan `attendance_logs`), reason, pre_approval_status (pending/approved/rejected), claim_status (none/pending/needs_review/approved/rejected), calculated_pay.
- `overtime_rate_rules`: day_type (working_day/holiday), hour_from, hour_to, multiplier (misal 1.5x, 2.0x), effective_from.

## 6. Catatan Teknis & Rekomendasi Tambahan

### a. Jangan auto-reject selisih waktu
- Jika durasi klaim lembur tidak persis cocok dengan log absensi (misal karyawan lupa check-out tepat waktu), sistem sebaiknya menandai untuk review manual HR, bukan langsung menolak otomatis — untuk menghindari friksi yang tidak perlu bagi karyawan.

### b. Ketergantungan pada kalender hari libur
- Formula upah lembur berbeda untuk hari kerja biasa vs hari libur/akhir pekan. Modul ini perlu merujuk ke layanan kalender bersama (lihat `prd_core_shared_services.md`).

### c. Rate lembur sebagai konfigurasi
- Formula perhitungan lembur (misal 1.5x jam pertama, 2x jam berikutnya) harus disimpan sebagai data konfigurasi, bukan hardcode, agar mudah disesuaikan bila ada perubahan kebijakan internal atau regulasi.

## 7. Dependensi Modul Lain
- **Attendance**: sumber validasi waktu aktual.
- **Payroll**: menerima data lembur final sebagai komponen gaji.
- **Shared Services**: kalender hari libur, notifikasi approval.

## 8. Kriteria Sukses
- Tidak ada klaim lembur yang lolos ke payroll tanpa tervalidasi terhadap data absensi.
- HR dapat melihat rekap lembur per periode dengan jelas untuk keperluan audit internal.