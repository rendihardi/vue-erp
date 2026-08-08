# PRD: Payroll (Penggajian)

## 1. Deskripsi
Modul perhitungan gaji otomatis bulanan/mingguan berdasarkan data kehadiran, cuti, dan lembur, termasuk potongan wajib (BPJS, PPh 21) dan penerbitan slip gaji digital.

## 2. Tujuan
- Mengotomatisasi perhitungan gaji agar akurat dan konsisten sesuai regulasi Indonesia.
- Mengurangi kesalahan manual yang berdampak langsung pada kepercayaan karyawan.
- Menyediakan slip gaji digital yang dapat diakses karyawan kapan saja.

## 3. Fitur Utama
- Perhitungan gaji otomatis berbasis data absensi, cuti, dan lembur.
- Potongan keterlambatan (berdasarkan `attendance_logs`).
- Perhitungan uang lembur (dari modul Overtime).
- Potongan cuti di luar tanggungan (dari modul Leave).
- Potongan BPJS Kesehatan & BPJS Ketenagakerjaan (JHT, JKK, JKM, JP).
- Perhitungan PPh 21.
- Cetak/unduh slip gaji digital (PDF).
- Riwayat gaji per karyawan (self-service).

## 4. Alur Proses (Ringkas)
1. Admin HR memicu proses payroll periode tertentu (manual trigger, bukan auto-run tanpa review).
2. Sistem mengambil data dari `attendance_logs`, `leave_requests`, `overtime_claims`.
3. Sistem menghitung komponen gaji: gaji pokok, tunjangan, potongan, lembur.
4. Sistem menghitung BPJS dan PPh 21 berdasarkan tabel rate yang berlaku.
5. Admin HR mereview hasil kalkulasi sebelum finalisasi (tidak langsung auto-approve).
6. Setelah difinalisasi, slip gaji digital diterbitkan dan dapat diunduh karyawan.

## 5. Kebutuhan Data / Skema Utama
- `payroll_periods`: periode, status (draft/reviewed/finalized).
- `payroll_items`: employee_id, periode_id, komponen (gaji pokok, tunjangan, potongan, lembur, BPJS, PPh21), total_bersih.
- `tax_rate_table` & `bpjs_rate_table`: tabel rate yang **dapat diubah dari admin panel**, bukan hardcode di kode program — karena rate ini berubah mengikuti regulasi pemerintah.
- `payslips`: employee_id, periode_id, file_pdf, tanggal_terbit.

## 6. Catatan Teknis & Rekomendasi Tambahan

### a. Metode perhitungan PPh 21 — perlu keputusan eksplisit
Ada 3 metode yang lazim dipakai perusahaan di Indonesia:
- **Gross**: pajak ditanggung karyawan, mengurangi gaji bersih.
- **Gross-Up**: perusahaan memberi tunjangan pajak agar gaji bersih karyawan tidak berkurang.
- **Net**: pajak ditanggung penuh oleh perusahaan.

Dokumen PRD ini perlu ditentukan metode mana yang dipakai sebelum development dimulai, karena formulanya berbeda signifikan.

### b. Skema TER (Tarif Efektif Rata-rata)
Sejak 2024, perhitungan PPh 21 bulanan menggunakan skema **TER**, berbeda dari skema tarif progresif lama yang dulu dihitung manual per bulan. Pastikan tim development mengacu ke skema TER yang berlaku, dan tabel TER disimpan sebagai data yang bisa diperbarui, bukan hardcode.

### c. BPJS
- BPJS Kesehatan, JHT, JKK, JKM, dan JP masing-masing punya persentase dan **batas atas gaji** (*capping*) yang berbeda. Simpan sebagai konfigurasi, bukan konstanta di kode.

### d. Review sebelum finalisasi
- Jangan buat payroll langsung final otomatis. Sediakan tahap "draft → review → finalize" agar HR bisa mengoreksi anomali (misal data lembur ganda) sebelum slip gaji diterbitkan ke karyawan.

### e. Testing
- Modul ini paling rawan terhadap kesalahan hitung yang berdampak finansial langsung. Sangat disarankan ada unit test untuk setiap formula (lembur, BPJS, PPh21) dengan kasus uji dari contoh perhitungan resmi.

## 7. Dependensi Modul Lain
- **Attendance**: sumber data keterlambatan.
- **Leave**: sumber data potongan cuti di luar tanggungan.
- **Overtime**: sumber data upah lembur.
- **Employee Contracts**: menentukan komponen gaji sesuai jenis kontrak.

## 8. Kriteria Sukses
- Hasil kalkulasi gaji sample cocok 100% dengan perhitungan manual/spreadsheet pembanding.
- Rate BPJS/PPh21 dapat diubah tanpa deploy ulang kode.
- Slip gaji dapat diunduh karyawan dalam format PDF yang rapi.