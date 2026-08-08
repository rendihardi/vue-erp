# PRD: Performance Management (KPI & Penilaian Kerja)

## 1. Deskripsi
Modul penyusunan target Key Performance Indicator (KPI) karyawan, penilaian berkala (Self-Assessment, 360-degree feedback, Peer-review), dan laporan performa kerja sebagai bahan evaluasi kenaikan jabatan/kontrak.

## 2. Tujuan
- Menstandarkan proses evaluasi kinerja agar objektif dan terdokumentasi.
- Menyediakan data historis performa sebagai dasar keputusan promosi, perpanjangan kontrak, atau pemutusan hubungan kerja.

## 3. Fitur Utama
- Penyusunan target KPI per karyawan/jabatan per periode (kuartalan/tahunan).
- Self-assessment oleh karyawan.
- Penilaian atasan langsung.
- 360-degree feedback (opsional, melibatkan rekan kerja/bawahan).
- Peer-review terstruktur.
- Kalkulasi skor akhir gabungan (dengan bobot yang dapat dikonfigurasi antar sumber penilaian).
- Laporan performa per karyawan dan riwayat penilaian antar periode.

## 4. Alur Proses (Ringkas)
1. HR/atasan menetapkan target KPI karyawan di awal periode.
2. Menjelang akhir periode, sistem membuka jendela penilaian: karyawan mengisi self-assessment, atasan menilai, dan (jika diaktifkan) rekan kerja memberi peer-review.
3. Sistem menghitung skor akhir berdasarkan bobot yang dikonfigurasi per sumber penilaian.
4. Hasil disampaikan ke karyawan (dengan/tanpa sesi diskusi tatap muka, tergantung kebijakan perusahaan) dan disimpan sebagai riwayat performa.

## 5. Kebutuhan Data / Skema Utama
- `kpi_targets`: employee_id, periode, indikator, target_value, bobot.
- `performance_reviews`: employee_id, periode, tipe_penilai (self/atasan/peer/360), penilai_id, skor, catatan.
- `performance_summary`: employee_id, periode, skor_akhir_gabungan, status (draft/final).

## 6. Catatan Teknis & Rekomendasi Tambahan

### a. Anonimitas peer-review/360
- Jika 360-degree feedback diaktifkan, pertimbangkan opsi anonimitas penilai agar umpan balik lebih jujur — tapi tetap simpan `penilai_id` di database (tersembunyi dari tampilan karyawan yang dinilai) untuk keperluan akuntabilitas HR.

### b. Bobot penilaian sebagai konfigurasi
- Rasio bobot self-assessment vs atasan vs peer sebaiknya dapat diatur per departemen/jabatan, bukan nilai tetap di kode, karena kebijakan ini sering berbeda antar level jabatan.

### c. Sensitivitas data
- Hasil penilaian kinerja adalah data sensitif yang berdampak pada karier karyawan. Pastikan kontrol akses ketat: karyawan hanya bisa melihat penilaian dirinya sendiri, atasan hanya bisa melihat tim langsungnya, kecuali HR/Owner.

## 7. Dependensi Modul Lain
- **Employee Contracts (Attendance module)**: hasil performa menjadi salah satu input evaluasi perpanjangan kontrak.
- **Shared Services**: notifikasi jendela waktu penilaian, audit log akses data penilaian.

## 8. Kriteria Sukses
- Setiap karyawan memiliki riwayat KPI dan skor performa yang dapat ditelusuri lintas periode.
- Proses penilaian berjalan dalam jendela waktu yang ditentukan tanpa keterlambatan input dari penilai.