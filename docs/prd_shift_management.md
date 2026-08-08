# PRD: Complex Shift Management (Manajemen Shift Kerja)

## 1. Deskripsi
Modul pengaturan jadwal kerja bergilir (*shifting*), termasuk roster mingguan/bulanan, shift malam, pertukaran shift antar karyawan, dan toleransi keterlambatan khusus per shift.

## 2. Tujuan
- Memudahkan penyusunan jadwal kerja untuk tim dengan pola shift kompleks (retail, produksi, keamanan, dll).
- Memberi fleksibilitas pertukaran shift antar karyawan tanpa mengganggu keakuratan data absensi/payroll.

## 3. Fitur Utama
- Definisi jenis shift (jam mulai, jam selesai, toleransi keterlambatan per shift).
- **Mode shift per karyawan**: setiap karyawan ditetapkan sebagai **Fixed** (shift tetap) atau **Roster** (shift bergilir).
- **Tim Shift (Shift Team)**: pengelompokan karyawan roster ke dalam tim, untuk perencanaan shift secara massal per tim alih-alih satu per satu per karyawan.
- **Pola rotasi per tim**: HR mendefinisikan pola rotasi (misal Tim A: Pagi → Siang → Malam → Libur, berputar tiap minggu) yang otomatis digenerate menjadi jadwal harian untuk seluruh anggota tim.
- Penyusunan roster mingguan/bulanan (otomatis dari pola tim, atau manual per karyawan untuk kasus pengecualian).
- Dukungan shift malam (lintas hari kalender).
- Pengajuan tukar shift antar karyawan, dengan approval atasan.
- Notifikasi jadwal shift ke karyawan (H-1 atau sesuai kebijakan).
- Tampilan kalender roster untuk HR dan karyawan — bisa difilter per tim atau per karyawan.

## 4. Konsep Mode Shift: Fixed vs Roster

### a. Fixed (Shift Tetap)
Karyawan mengikuti satu jenis shift yang sama setiap hari kerja (misal staf kantor: Senin-Jumat jam 09:00-17:00). Cocok untuk posisi non-operasional.
- Cukup ditetapkan sekali di profil karyawan: `shift_type_id` + pola hari kerja (misal Senin-Jumat, atau 6 hari kerja 1 hari libur).
- **Tidak perlu** dijadwalkan ulang tiap periode — sistem otomatis menganggap karyawan ini bekerja sesuai jam tersebut setiap hari kerja, kecuali ada cuti/izin yang tercatat.
- HR tetap bisa override manual untuk tanggal tertentu jika diperlukan (misal lembur pindah shift sementara).

### b. Roster (Shift Bergilir)
Karyawan dijadwalkan lewat keanggotaan dalam **Tim Shift**, bukan dijadwalkan satu-satu.
1. HR membuat Tim Shift (misal "Tim Produksi A", "Tim Keamanan Malam") dan menetapkan anggotanya.
2. HR mendefinisikan **pola rotasi** untuk tim tersebut — urutan jenis shift dan berapa lama tiap jenis shift berlaku sebelum berotasi (misal 7 hari Pagi → 7 hari Siang → 7 hari Malam → 2 hari libur, lalu berulang).
3. Sistem otomatis men-generate `shift_rosters` harian untuk **semua anggota tim** berdasarkan pola tersebut, untuk rentang tanggal yang ditentukan (misal generate untuk 1 bulan ke depan).
4. HR dapat melakukan override manual pada tanggal tertentu untuk individu (misal satu anggota tim perlu shift berbeda hari itu), tanpa mengubah pola tim secara keseluruhan.
5. Jika karyawan pindah tim di tengah periode, roster yang sudah ter-generate sebelumnya tetap tersimpan sebagai riwayat; roster baru mengikuti tim yang baru sejak tanggal perpindahan.

## 5. Alur Proses (Ringkas)
1. HR menetapkan mode shift karyawan baru: Fixed atau Roster (saat onboarding atau perubahan status).
2. **Jika Fixed**: HR set jenis shift + pola hari kerja sekali, otomatis berlaku terus tanpa perlu dijadwalkan ulang.
3. **Jika Roster**: HR memasukkan karyawan ke Tim Shift yang sesuai, lalu mendefinisikan/menggunakan pola rotasi tim yang sudah ada.
4. Sistem men-generate roster harian untuk anggota tim secara otomatis sesuai pola, untuk periode ke depan (misal H+30).
5. Karyawan (fixed maupun roster) dapat melihat jadwal shift mereka di mobile app.
6. Jika karyawan roster ingin tukar shift, ia mengajukan permintaan ke rekan kerja tertentu.
7. Rekan kerja menerima → permintaan disetujui secara final oleh **HR Admin** (1-Level HR Approval).
8. Setelah disetujui HR Admin, roster individu diperbarui secara otomatis (tanpa mengubah pola tim) dan digunakan sebagai acuan toleransi keterlambatan di modul Attendance.

## 6. Kebutuhan Data / Skema Utama
- `shift_types`: nama, jam_mulai, jam_selesai, toleransi_menit, lintas_hari (boolean).
- `employees.shift_mode`: enum(`fixed`, `roster`).
- `employee_fixed_shifts`: employee_id, shift_type_id, pola_hari_kerja (misal array hari: Senin-Jumat), berlaku_sejak.
- `shift_teams`: id, nama, deskripsi.
- `shift_team_members`: team_id, employee_id, tanggal_gabung, tanggal_keluar (nullable, untuk riwayat perpindahan tim).
- `shift_rotation_patterns`: team_id, urutan_shift (JSON berisi daftar shift_type_id + durasi_hari per tahap), tanggal_mulai_pola.
- `shift_rosters`: employee_id, team_id (nullable, terisi jika berasal dari pola tim), shift_type_id, tanggal, sumber (`auto_generated` / `manual_override`).
- `shift_swaps`: requester_employee_id, target_employee_id, requester_roster_id, target_roster_id, target_status (`pending`/`accepted`/`rejected`), status (`pending`/`approved`/`rejected`), approved_by (user_id HR Admin).

## 7. Catatan Teknis & Rekomendasi Tambahan

### a. Shift lintas hari kalender (shift malam)
- Perlu penanganan khusus di logika perhitungan durasi kerja dan potongan keterlambatan saat shift dimulai malam hari dan berakhir dini hari keesokan harinya — pastikan `attendance_logs` dan kalkulasi payroll tidak salah menghitung ini sebagai dua entri terpisah yang tidak berkaitan.

### b. Tukar shift butuh persetujuan ganda
- Sebaiknya tukar shift memerlukan persetujuan dari **rekan kerja yang dituju** terlebih dahulu, baru diteruskan ke atasan — bukan atasan langsung memutuskan sepihak — agar tidak ada karyawan yang jadwalnya diubah tanpa sepengetahuan/persetujuannya.

### c. Cegah roster bentrok dengan cuti
- Saat menyusun roster (baik generate otomatis dari pola tim maupun manual), sistem sebaiknya memvalidasi silang dengan modul Leave agar tidak menjadwalkan karyawan yang sedang cuti disetujui. Jika bentrok terdeteksi saat generate massal, tandai tanggal tersebut sebagai "perlu penugasan pengganti" alih-alih membiarkan slot kosong tanpa peringatan.

### d. Ketergantungan pada kalender hari libur
- Roster perlu tahu hari libur nasional untuk keperluan perhitungan lembur otomatis dan tampilan kalender. Lihat `prd_core_shared_services.md`.

### e. Override individual tidak boleh "tertimpa" saat pola tim diperbarui
- Jika HR mengubah pola rotasi tim setelah beberapa roster sudah di-generate dan sebagian di-override manual untuk individu tertentu, proses regenerasi **tidak boleh menimpa** entri yang berstatus `manual_override`. Regenerasi hanya menyentuh entri berstatus `auto_generated`.

### f. Konsistensi saat perpindahan mode/tim
- Saat karyawan berubah dari Fixed ke Roster (atau sebaliknya), atau pindah dari satu Tim Shift ke Tim Shift lain, roster yang sudah lewat (histori) tidak diubah — perubahan hanya berlaku untuk tanggal efektif ke depan. Ini penting agar data historis untuk payroll periode yang sudah difinalisasi tidak berubah retroaktif.

### g. Kapasitas & keseimbangan tim
- Pertimbangkan validasi sederhana saat generate roster tim: apakah jumlah anggota yang kebagian shift tertentu di suatu tanggal memenuhi kebutuhan minimum operasional (misal minimal 3 orang shift malam). Ini bisa berupa peringatan, bukan hard-block, agar HR tetap punya kendali akhir.

## 8. Dependensi Modul Lain
- **Attendance**: sumber acuan toleransi keterlambatan aktual per shift.
- **Leave**: validasi silang agar roster tidak bentrok dengan cuti.
- **Overtime**: shift menentukan jam kerja normal sebagai basis perhitungan lembur.
- **Shared Services**: kalender hari libur, notifikasi jadwal.

## 9. Kriteria Sukses
- HR dapat menyusun roster satu bulan penuh untuk satu tim hanya dengan mendefinisikan pola rotasi sekali, tanpa input manual per karyawan per hari.
- Karyawan Fixed tidak pernah muncul di layar penjadwalan roster kecuali ada override manual.
- Tidak ada roster yang bentrok dengan cuti karyawan yang sudah disetujui.
- Perhitungan keterlambatan pada shift malam akurat tanpa anomali tanggal.
- Perubahan pola rotasi tim tidak menimpa override manual individu yang sudah ada.