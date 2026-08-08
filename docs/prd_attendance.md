# PRD: Attendance & Employee Contracts

## 1. Deskripsi

Modul inti pencatatan kehadiran karyawan secara mandiri (_self-service_) melalui aplikasi mobile, menggunakan verifikasi wajah (_face recognition_) dan validasi lokasi GPS (_geofencing_). Modul ini juga mencakup pengelolaan data master karyawan dan riwayat kontrak kerja (PKWT/PKWTT).

## 2. Tujuan

- Menggantikan absensi manual/fingerprint dengan metode yang lebih sulit dimanipulasi.
- Memberi HR visibilitas real-time atas kehadiran karyawan lintas lokasi/cabang.
- Menyediakan data dasar (attendance log) yang akurat untuk perhitungan payroll dan overtime.

## 3. Fitur Utama

- Absen masuk/keluar via mobile app (foto selfie + koordinat GPS).
- Validasi geofencing berbasis radius per cabang/lokasi kantor (`office_locations`).
- Registrasi & verifikasi wajah (InsightFace) via `employee_face_profiles` — lihat detail teknis di §6.
- Riwayat kehadiran karyawan (harian/mingguan/bulanan).
- Dashboard monitoring kehadiran real-time untuk HR/Owner.
- Manajemen data master karyawan (biodata, jabatan, departemen, penempatan kantor).
- Riwayat kontrak kerja (PKWT/PKWTT) dengan reminder jatuh tempo kontrak.

## 4. Alur Proses (Ringkas)

1. Karyawan membuka app → kamera aktif → ambil foto selfie.
2. App mengambil koordinat GPS perangkat.
3. Data dikirim ke API Laravel → validasi geofencing lokasi kantor (`office_locations`) di server.
4. Foto diteruskan ke microservice FastAPI untuk verifikasi wajah terhadap `employee_face_profiles` aktif.
5. Jika lolos kedua validasi → status hadir tercatat, log tersimpan di `attendance_logs`.
6. Jika gagal → tampilkan alasan spesifik ke karyawan (di luar radius / wajah tidak cocok) dan catat sebagai percobaan gagal untuk keperluan audit.

## 5. Kebutuhan Data / Skema Utama

- `employees`: biodata, departemen_id, jabatan_id, office_location_id, shift_mode (fixed/roster), status_aktif.
- `departments`: nama divisi.
- `office_locations`: nama kantor/cabang, alamat, koordinat (lat/long), radius_meters, status_aktif.
- `employee_location_history`: employee_id, office_location_id, start_date, end_date.
- `employee_face_profiles`: employee_id, embedding, model_version, status (active/superseded/revoked), consent_given_at.
- `attendance_logs`: employee_id, shift_roster_id, attendance_date, check_in/out_time, check_in/out_coords, check_in/out_matched_face_profile_id, check_in/out_face_confidence, check_in/out_liveness_passed, check_in/out_status.
- `employee_contracts`: employee_id, nomor_kontrak, tipe_kontrak, tanggal_mulai, tanggal_selesai, dokumen_pdf, status.

Sejak Sprint 2, skema `attendance_logs` sebaiknya sudah menyertakan kolom `face_confidence_score` dan `embedding_ref` meski verifikasi wajah baru aktif di Sprint 4 — agar tidak perlu migrasi skema besar nanti.

## 6. Catatan Teknis & Rekomendasi Tambahan

### a. Anti-spoofing (penting, sering terlewat)

- **Liveness detection**: InsightFace tidak otomatis mendeteksi apakah wajah berasal dari orang asli atau foto/video. Perlu langkah tambahan (misal: deteksi kedipan, atau liveness model terpisah) di FastAPI sebelum face matching, supaya karyawan tidak bisa absen pakai foto rekan kerja.
- **Mock location detection**: GPS di Android bisa dipalsukan dengan aplikasi fake GPS. Mobile app perlu membaca flag `isMock` dari location provider dan menolak absen jika terdeteksi mock location.

### b. Penyimpanan foto selfie

- Hindari storage lokal server sejak awal. Gunakan object storage (S3-compatible / MinIO) dengan enkripsi at-rest, agar migrasi tidak diperlukan saat data bertambah besar dan agar lebih mudah memenuhi kebutuhan retensi data.

### c. Kepatuhan UU PDP

- Data wajah adalah data pribadi spesifik → wajib ada **persetujuan eksplisit** (bukan default opt-in) saat registrasi wajah pertama kali.
- Perlu kebijakan retensi: foto & embedding dihapus otomatis X hari setelah karyawan resign.
- Sediakan mekanisme karyawan meminta penghapusan data wajahnya (hak subjek data sesuai UU PDP).

### d. Audit log percobaan gagal

- Simpan log percobaan absen gagal (lokasi di luar radius, wajah tidak cocok) sebagai data untuk investigasi kecurangan, bukan hanya log yang berhasil.

## 7. Dependensi Modul Lain

- **Payroll**: menggunakan `attendance_logs` sebagai basis potongan keterlambatan.
- **Overtime**: memvalidasi klaim lembur terhadap log absensi aktual.
- **Shift Management**: menentukan jam kerja normal & toleransi keterlambatan per shift.

## 8. Kriteria Sukses

- Alur end-to-end (absen di HP → termonitor di web HR) berjalan tanpa delay signifikan (<5 detik proses verifikasi).
- Tingkat false-positive/false-negative face matching terukur dan didokumentasikan.
- Tidak ada insiden absensi tervalidasi dari lokasi/wajah palsu selama masa uji.
