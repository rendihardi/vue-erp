# PRD: Recruitment & Onboarding

## 1. Deskripsi

Modul manajemen lowongan pekerjaan internal/eksternal, pelacakan pelamar (Applicant Tracking System - ATS), penjadwalan wawancara, hingga konversi otomatis pelamar yang diterima menjadi data karyawan baru.

## 2. Tujuan

- Menyentralisasi proses rekrutmen agar mudah dilacak, dari posting lowongan hingga onboarding.
- Mengurangi entri data ganda saat pelamar diterima menjadi karyawan.

## 3. Fitur Utama

- Manajemen lowongan pekerjaan (buat, publikasikan, tutup).
- Formulir pelamaran untuk kandidat eksternal (dapat diakses tanpa login).
- Pelacakan status pelamar (ATS): melamar → screening → wawancara → offer → diterima/ditolak.
- Penjadwalan wawancara dengan notifikasi ke pewawancara dan kandidat.
- Catatan evaluasi wawancara oleh pewawancara.
- Konversi otomatis data pelamar diterima menjadi entri `employees` baru (menghindari input ulang manual).

## 4. Alur Proses (Ringkas)

1. HR membuka lowongan baru dengan kriteria & deskripsi pekerjaan.
2. Kandidat mengajukan lamaran melalui form publik (atau HR input manual untuk kandidat internal).
3. HR memindahkan status kandidat melalui tahapan ATS.
4. Wawancara dijadwalkan, hasil evaluasi dicatat.
5. Jika kandidat diterima, HR memicu konversi data → sistem otomatis membuat entri karyawan baru dengan data dasar terisi dari data pelamar (nama, kontak, dokumen), siap dilengkapi HR untuk kontrak dan penempatan.

## 5. Kebutuhan Data / Skema Utama

- `job_postings`: judul, departemen, deskripsi, status (buka/tutup), tanggal_publish.
- `candidates`: nama, kontak, dokumen (CV), sumber_lamaran.
- `applications`: candidate_id, job_posting_id, status_tahap, catatan_evaluasi.
- `interview_schedules`: application_id, pewawancara, waktu, lokasi/link, hasil.

## 6. Catatan Teknis & Rekomendasi Tambahan

### a. Kepatuhan data pelamar (UU PDP)

- Data pelamar yang tidak diterima tetap merupakan data pribadi. Perlu kebijakan retensi (misal dihapus/dianonimkan setelah X bulan jika tidak diterima) dan bukan disimpan tanpa batas waktu.

### b. Form publik perlu proteksi dasar

- Karena form lamaran dapat diakses tanpa login, perlu rate-limiting dan validasi upload file (tipe & ukuran) untuk mencegah penyalahgunaan/spam.

### c. Konversi data — bukan duplikasi manual

- Pastikan proses konversi pelamar → karyawan memetakan field secara eksplisit (nama, kontak, dokumen) sehingga HR tidak perlu mengetik ulang data yang sudah ada di sistem.

## 7. Dependensi Modul Lain

- **Employee Contracts (Attendance module)**: menerima data karyawan baru hasil konversi untuk dilengkapi kontrak kerja.
- **Shared Services**: notifikasi jadwal wawancara.

## 8. Kriteria Sukses

- HR dapat melacak status setiap kandidat tanpa spreadsheet terpisah.
- Konversi pelamar diterima → karyawan baru tidak memerlukan input ulang data dasar.
