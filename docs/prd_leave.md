# PRD: Leave & Time-Off (Manajemen Cuti & Izin)

## 1. Deskripsi

Modul pengajuan dan persetujuan cuti/izin karyawan melalui aplikasi mobile, dengan alur persetujuan langsung (1-level approval) oleh HR Admin.

## 2. Tujuan

- Menggantikan pengajuan cuti manual (kertas/chat) dengan sistem terstruktur dan terlacak.
- Memberi HR visibilitas atas sisa kuota cuti dan histori pengajuan karyawan.
- Menyediakan data akurat untuk perhitungan potongan gaji terkait cuti di luar tanggungan.

## 3. Fitur Utama

- Pengajuan cuti tahunan (dengan validasi sisa kuota).
- Pengajuan sakit dengan unggah surat dokter (foto/PDF).
- Pengajuan izin khusus (menikah, duka, dll — sesuai kebijakan perusahaan).
- Pengajuan izin setengah hari.
- Persetujuan langsung 1 tingkat oleh HR Admin (Approve/Reject).
- Notifikasi status pengajuan ke karyawan (disetujui/ditolak).
- Kalender cuti tim (agar HR dan tim dapat melihat siapa saja yang sedang cuti).
- Laporan sisa kuota cuti per karyawan.

## 4. Alur Proses (Ringkas)

1. Karyawan mengajukan cuti/izin via mobile app, memilih tanggal & jenis, unggah dokumen jika perlu.
2. Sistem validasi sisa kuota cuti tahunan (jika berlaku).
3. HR Admin menyetujui atau menolak pengajuan (1-level approval).
4. Status final tersimpan (`approved`/`rejected`) dan memengaruhi kalkulasi payroll periode terkait (jika cuti di luar tanggungan).

## 5. Kebutuhan Data / Skema Utama

- `leave_types`: nama jenis cuti, default_quota, memotong kuota (is_paid), wajib dokumen (requires_document).
- `leave_balances`: employee_id, leave_type_id, year, initial_quota, remaining_quota.
- `leaves`: employee_id, leave_type_id, start_date, end_date, total_days, reason, attachment_path, status (pending/approved/rejected).

## 6. Catatan Teknis & Rekomendasi Tambahan

### a. Ketergantungan pada kalender hari libur

- Perhitungan jumlah hari cuti (terutama cuti yang melewati akhir pekan/libur nasional) memerlukan referensi kalender hari libur. Modul ini bergantung pada layanan kalender bersama — lihat `prd_core_shared_services.md`. Jangan hardcode hari libur di modul ini.

### b. Notifikasi

- Approval notification: HR Admin menerima notifikasi saat ada pengajuan baru, dan karyawan menerima notifikasi saat status disetujui/ditolak oleh HR.

### c. Validasi dokumen surat dokter

- Sediakan validasi minimal (format file, ukuran maksimal) saat unggah surat dokter agar tidak membebani storage dan agar file dapat dibuka HR tanpa masalah kompatibilitas.

## 7. Dependensi Modul Lain

- **Payroll**: menggunakan status cuti final untuk potongan gaji.
- **Shift Management**: memastikan tidak ada bentrok jadwal shift saat karyawan cuti.
- **Shared Services**: kalender hari libur, notifikasi, audit log approval.

## 8. Kriteria Sukses

- Karyawan dapat mengajukan dan melacak status cuti tanpa perlu bertanya manual ke HR.
- Approver menerima notifikasi dalam waktu wajar (<1 menit) setelah pengajuan.
- Data sisa kuota cuti selalu konsisten antara mobile app dan dashboard HR.
