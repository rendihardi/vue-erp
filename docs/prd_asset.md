# PRD: Asset Management (Manajemen Aset)

## 1. Deskripsi
Modul inventarisasi barang/alat kantor yang dipinjamkan ke karyawan (laptop, kendaraan, HP, dll), termasuk pelacakan tanggal pengembalian, status kondisi barang, dan form serah terima aset digital.

## 2. Tujuan
- Memberi visibilitas kepada perusahaan atas aset yang sedang dipinjam dan oleh siapa.
- Menyediakan bukti serah terima digital yang sah secara administratif, menggantikan form kertas.

## 3. Fitur Utama
- Inventarisasi master aset (kategori, nomor seri, kondisi awal, nilai).
- Peminjaman aset ke karyawan dengan tanggal pinjam & rencana kembali.
- Form serah terima digital (tanda tangan digital karyawan & petugas aset).
- Pelacakan status kondisi barang saat dipinjam dan saat dikembalikan (dengan foto kondisi).
- Reminder pengembalian aset mendekati jatuh tempo.
- Laporan aset per karyawan dan riwayat mutasi aset.

## 4. Alur Proses (Ringkas)
1. Admin mencatat aset baru ke master inventaris.
2. Saat aset dipinjamkan, admin membuat entri peminjaman dan form serah terima digital ditandatangani kedua pihak (karyawan & admin aset).
3. Sistem mengirim reminder mendekati tanggal rencana pengembalian.
4. Saat pengembalian, kondisi barang dicatat ulang (foto + catatan) dan status peminjaman ditutup.
5. Jika karyawan resign, sistem menandai aset yang masih dipinjam sebagai perlu ditindaklanjuti sebelum proses offboarding selesai.

## 5. Kebutuhan Data / Skema Utama
- `assets`: nama, kategori, nomor_seri, kondisi_awal, nilai, status (tersedia/dipinjam/rusak/hilang).
- `asset_loans`: asset_id, employee_id, tanggal_pinjam, rencana_kembali, tanggal_kembali_aktual, kondisi_saat_pinjam, kondisi_saat_kembali.
- `asset_handover_forms`: loan_id, file_dokumen/signature, tanggal.

## 6. Catatan Teknis & Rekomendasi Tambahan

### a. Keterkaitan dengan proses resign/offboarding
- Ini adalah titik integrasi yang sering terlewat: sebelum status karyawan diubah menjadi nonaktif di modul Employee, sistem sebaiknya mengecek apakah masih ada aset yang belum dikembalikan, dan memberi peringatan ke HR.

### b. Dokumentasi kondisi dengan foto
- Foto kondisi barang saat pinjam vs kembali membantu menghindari perselisihan soal kerusakan — sederhana untuk diimplementasikan namun bernilai tinggi secara administratif.

### c. Tanda tangan digital
- Tidak perlu solusi tanda tangan digital bersertifikat elektronik (mahal/kompleks) untuk MVP — cukup dengan menyimpan tanda tangan gambar (signature pad) yang dilampirkan ke PDF form serah terima, sudah memadai untuk kebutuhan administratif internal.

## 7. Dependensi Modul Lain
- **Employee Master (Attendance module)**: status aktif/resign karyawan memengaruhi proses pengembalian aset.
- **Shared Services**: notifikasi reminder pengembalian.

## 8. Kriteria Sukses
- Tidak ada aset yang "hilang jejak" karena tidak tercatat status peminjamannya.
- Proses offboarding karyawan selalu memeriksa status aset sebelum selesai.