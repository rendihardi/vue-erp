# Database Design (Final): HR ERP System — UUID (MySQL)

Dokumen ini adalah revisi dari skema yang sudah Anda buat, dengan perbaikan berdasarkan hasil diskusi PRD sebelumnya. Struktur UUID dan pola implementasi Laravel (HasUuids, Sanctum, Spatie) mengikuti pendekatan yang sudah Anda tetapkan.

---

## 1. Penyimpanan Data Face Recognition — Penjelasan Khusus

**Jangan simpan embedding wajah langsung sebagai kolom di tabel `employees`.** Dipisah ke tabel `employee_face_profiles` tersendiri. Alasannya ada di pesan sebelumnya (data paling sensitif, butuh riwayat versi, butuh metadata model AI).

**Alur datanya:**
- `employee_face_profiles` menyimpan **vektor acuan** (embedding hasil registrasi wajah) — satu employee bisa punya lebih dari satu baris (riwayat registrasi ulang), tapi hanya satu yang `status = 'active'`.
- `attendance_logs` menyimpan **hasil pencocokan** tiap kali absen (skor kecocokan, lolos liveness atau tidak, embedding acuan mana yang dipakai) — bukan vektornya lagi, cukup referensi (`matched_face_profile_id`).

**Dua opsi lokasi fisik penyimpanan vektor**, pilih sesuai skala:
| Opsi | Kapan cocok | Catatan |
|---|---|---|
| **A. Di MySQL** (kolom `embedding` terenkripsi, tipe `TEXT`/`JSON`) | Skala kecil-menengah (ratusan-ribuan karyawan) | Paling sederhana untuk MVP. Enkripsi at-rest via Laravel encrypted cast. FastAPI mengambil via API Laravel, bukan akses DB langsung. |
| **B. Di vector store terpisah** (misal Milvus/Faiss, dikelola microservice FastAPI) | Skala besar / butuh pencarian similarity cepat | MySQL hanya simpan `id` referensi + metadata (versi, consent, status), vektor aslinya hidup di sisi FastAPI. |

Untuk roadmap Sprint 4 Anda (MVP awal), **Opsi A sudah cukup** — tinggal upgrade ke Opsi B nanti kalau jumlah karyawan sudah besar dan matching mulai terasa lambat.

---

## 2. Panduan Implementasi Laravel (tetap sama seperti draft Anda)

```php
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasUuids;
    protected $keyType = 'string';
    public $incrementing = false;
}
```

Rekomendasi tambahan: gunakan **UUIDv7** (Laravel 11 `HasUuids` sudah generate versi ini secara default) supaya index tetap terurut secara waktu dan performa clustered index MySQL tidak terdegradasi — seperti sudah Anda catat di bagian strategi indexing.

---

## 3. Ringkasan Kegunaan Tabel per Modul

### A. Core / Organisasi
| Tabel | Kegunaan |
|---|---|
| `users` | Akun login (email/password), dasar autentikasi Sanctum. Terpisah dari `employees` karena tidak semua user harus punya profil karyawan (misal akun admin sistem). |
| `roles`, `permissions`, `model_has_roles`, `model_has_permissions`, `role_has_permissions` | Standar Spatie Permission — mengatur hak akses per user (HR, Owner, Karyawan, dst). |
| `departments` | Struktur organisasi (nama divisi). **Tidak lagi menyimpan koordinat geofence** — itu pindah ke `office_locations`. |
| `positions` | Jabatan karyawan, dipakai juga sebagai acuan `kpi_templates`. |
| `office_locations` | **[BARU]** Data cabang/kantor fisik: koordinat, radius geofence. Dipisah dari `departments` karena satu departemen bisa ada di banyak cabang, dan sebaliknya. |
| `employee_location_history` | **[BARU]** Riwayat penempatan cabang karyawan dari waktu ke waktu, supaya data absensi lama tetap valid secara historis meski karyawan sudah pindah cabang. |
| `national_holidays` | **[BARU]** Kalender hari libur nasional/cuti bersama — dipakai bareng oleh Leave, Overtime, dan Shift agar tidak hardcode di masing-masing modul. |
| `audit_logs` | **[BARU]** Jejak perubahan data sensitif (siapa mengubah apa, kapan) — terutama untuk Payroll, Contracts, dan Performance. |

### B. Karyawan & Kontrak
| Tabel | Kegunaan |
|---|---|
| `employees` | Data master karyawan (biodata, departemen, jabatan, cabang aktif, mode shift). Tidak lagi memuat kolom `face_embedding`. |
| `employee_contracts` | Riwayat kontrak kerja (PKWT/PKWTT), dipakai Payroll untuk menentukan komponen gaji dan Performance untuk evaluasi perpanjangan. |
| `employee_face_profiles` | **[BARU]** Vektor wajah acuan untuk verifikasi absensi — lihat §1. |

### C. Absensi & Shift
| Tabel | Kegunaan |
|---|---|
| `shift_types` | Definisi jenis shift (jam mulai/selesai, toleransi, apakah lintas hari). |
| `employee_fixed_shifts` | **[BARU]** Untuk karyawan bermode `fixed` — shift tetap tanpa perlu dijadwalkan ulang tiap periode. |
| `shift_teams` | **[BARU]** Grup karyawan roster untuk perencanaan shift massal. |
| `shift_team_members` | **[BARU]** Keanggotaan karyawan dalam tim shift, dengan riwayat keluar-masuk tim. |
| `shift_rotation_patterns` | **[BARU]** Pola rotasi shift per tim (misal Pagi→Siang→Malam→Libur), sumber generate roster otomatis. |
| `shift_rosters` | Jadwal shift harian per karyawan — sekarang bisa berasal dari pola tim (`auto_generated`) atau input manual (`manual_override`), menggantikan tabel `rosters` versi sebelumnya yang terlalu sederhana. |
| `shift_swaps` | Pengajuan tukar shift antar karyawan, dengan dua tahap approval (rekan kerja lalu atasan). |
| `attendance_logs` | Log kehadiran harian: waktu, lokasi, hasil verifikasi wajah, status validasi. |

### D. Cuti & Lembur
| Tabel | Kegunaan |
|---|---|
| `leave_types` | Jenis cuti/izin dan aturan dasarnya (memotong kuota/gaji, wajib dokumen). |
| `leave_balances` | **[BARU]** Sisa kuota cuti per karyawan per tahun — sebelumnya tidak ada tabel ini, hanya `default_quota` statis di `leave_types` yang tidak bisa melacak sisa kuota per individu. |
| `leaves` | Pengajuan cuti/izin karyawan (persetujuan langsung oleh HR Admin). |
| `overtimes` | Pengajuan pra-lembur dan klaim pasca-lembur, divalidasi terhadap `attendance_logs`. |
| `overtime_rate_rules` | **[BARU]** Formula pengali upah lembur (per jam ke berapa, hari kerja vs libur) sebagai data konfigurasi, bukan hardcode. |

### E. Rekrutmen
| Tabel | Kegunaan |
|---|---|
| `jobs` | Lowongan pekerjaan yang dibuka. |
| `candidates` | Data pelamar dan status tahapan ATS. |
| `interviews` | Jadwal dan hasil evaluasi wawancara. |

### F. Aset
| Tabel | Kegunaan |
|---|---|
| `assets` | Master inventaris aset perusahaan. |
| `asset_assignments` | Peminjaman aset ke karyawan, termasuk kondisi saat pinjam/kembali. |
| `asset_damage_reports` | Pelaporan kerusakan aset selama dipinjam. |
| `asset_handover_forms` | **[BARU]** Dokumen serah terima digital (PDF + tanda tangan) per peminjaman — sebelumnya belum ada, padahal disebut eksplisit di PRD sebagai bukti administratif. |

### G. Kinerja
| Tabel | Kegunaan |
|---|---|
| `kpi_templates` | Target KPI standar per jabatan. |
| `performance_evaluations` | Skor penilaian kinerja per periode (self, atasan, gabungan). |

### H. Payroll
| Tabel | Kegunaan |
|---|---|
| `payroll_periods` | **[BARU]** Status proses payroll per periode (draft/reviewed/finalized) — sebelumnya periode hanya berupa string di tabel `payrolls`, tidak ada status proses per periode secara keseluruhan. |
| `payrolls` | Rincian gaji per karyawan per periode. |
| `tax_rate_table` | **[BARU]** Tabel tarif PPh 21 skema TER, dapat diubah tanpa deploy ulang. |
| `bpjs_rate_table` | **[BARU]** Tabel persentase & batas atas BPJS (Kesehatan, JHT, JKK, JKM, JP), juga dapat dikonfigurasi. |
| `payslips` | **[BARU]** Referensi file PDF slip gaji, dipisah dari `payrolls` agar riwayat file tidak tercampur dengan data numerik. |

---

## 4. Skema DDL Lengkap

### A. Core / Organisasi

```sql
-- users: akun login dasar
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  remember_token VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- departments: struktur organisasi, TANPA koordinat geofence
CREATE TABLE departments (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- positions: jabatan
CREATE TABLE positions (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- office_locations [BARU]: cabang/kantor fisik dengan geofence
CREATE TABLE office_locations (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  address TEXT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_meters INT NOT NULL DEFAULT 50 CHECK (radius_meters > 0),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- national_holidays [BARU]: kalender hari libur bersama
CREATE TABLE national_holidays (
  id CHAR(36) PRIMARY KEY,
  holiday_date DATE NOT NULL,
  name VARCHAR(150) NOT NULL,
  type ENUM('national_holiday', 'collective_leave') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_holiday_date (holiday_date)
);

-- audit_logs [BARU]: jejak perubahan data sensitif
CREATE TABLE audit_logs (
  id CHAR(36) PRIMARY KEY,
  actor_id CHAR(36) NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id CHAR(36) NOT NULL,
  before_data JSON NULL,
  after_data JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_entity (entity_type, entity_id)
);
```

### B. Karyawan & Kontrak

```sql
-- employees: data master karyawan (TANPA kolom face_embedding)
CREATE TABLE employees (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  nik VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NULL,
  department_id CHAR(36) NOT NULL,
  position_id CHAR(36) NOT NULL,
  office_location_id CHAR(36) NOT NULL,
  shift_mode ENUM('fixed', 'roster') NOT NULL DEFAULT 'fixed',
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE RESTRICT,
  FOREIGN KEY (office_location_id) REFERENCES office_locations(id) ON DELETE RESTRICT,
  INDEX idx_employees_dept (department_id),
  INDEX idx_employees_pos (position_id),
  INDEX idx_employees_office (office_location_id)
);

-- employee_location_history [BARU]: riwayat mutasi cabang
CREATE TABLE employee_location_history (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  office_location_id CHAR(36) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NULL, -- NULL = masih berlaku
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (office_location_id) REFERENCES office_locations(id) ON DELETE RESTRICT,
  INDEX idx_loc_history_employee (employee_id)
);

-- employee_contracts
CREATE TABLE employee_contracts (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  contract_number VARCHAR(100) NOT NULL UNIQUE,
  contract_type ENUM('PKWT', 'PKWTT', 'Internship') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NULL,
  status ENUM('active', 'expired', 'terminated') DEFAULT 'active',
  document_path VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  INDEX idx_contracts_employee (employee_id),
  CONSTRAINT chk_contract_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- employee_face_profiles [BARU]: vektor wajah acuan, terpisah & bisa punya riwayat
CREATE TABLE employee_face_profiles (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  embedding TEXT NOT NULL, -- disimpan terenkripsi (Laravel encrypted cast)
  model_version VARCHAR(50) NOT NULL, -- misal "insightface-buffalo_l-v1"
  status ENUM('active', 'superseded', 'revoked') DEFAULT 'active',
  consent_given_at TIMESTAMP NOT NULL, -- kepatuhan UU PDP
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  superseded_by CHAR(36) NULL, -- menunjuk ke profil baru jika registrasi ulang

  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (superseded_by) REFERENCES employee_face_profiles(id) ON DELETE SET NULL,
  INDEX idx_face_profiles_employee (employee_id),
  INDEX idx_face_profiles_status (employee_id, status)
);
```

### C. Absensi & Shift

```sql
-- shift_types
CREATE TABLE shift_types (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  grace_period_minutes INT DEFAULT 0 CHECK (grace_period_minutes >= 0),
  is_overnight BOOLEAN DEFAULT FALSE, -- shift lintas hari kalender
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- employee_fixed_shifts [BARU]: untuk karyawan shift_mode = 'fixed'
CREATE TABLE employee_fixed_shifts (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  shift_type_id CHAR(36) NOT NULL,
  working_days JSON NOT NULL, -- misal ["monday","tuesday","wednesday","thursday","friday"]
  effective_from DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (shift_type_id) REFERENCES shift_types(id) ON DELETE RESTRICT,
  INDEX idx_fixed_shift_employee (employee_id)
);

-- shift_teams [BARU]
CREATE TABLE shift_teams (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- shift_team_members [BARU]
CREATE TABLE shift_team_members (
  id CHAR(36) PRIMARY KEY,
  team_id CHAR(36) NOT NULL,
  employee_id CHAR(36) NOT NULL,
  joined_at DATE NOT NULL,
  left_at DATE NULL,

  FOREIGN KEY (team_id) REFERENCES shift_teams(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  INDEX idx_team_members_team (team_id),
  INDEX idx_team_members_employee (employee_id)
);

-- shift_rotation_patterns [BARU]
CREATE TABLE shift_rotation_patterns (
  id CHAR(36) PRIMARY KEY,
  team_id CHAR(36) NOT NULL,
  pattern_sequence JSON NOT NULL, -- [{"shift_type_id":"...","days":7}, {"is_day_off":true,"days":2}]
  pattern_start_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (team_id) REFERENCES shift_teams(id) ON DELETE CASCADE,
  INDEX idx_rotation_team (team_id)
);

-- shift_rosters: menggantikan tabel `rosters` versi sebelumnya
CREATE TABLE shift_rosters (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  team_id CHAR(36) NULL, -- terisi jika berasal dari pola rotasi tim
  shift_type_id CHAR(36) NOT NULL,
  roster_date DATE NOT NULL,
  source ENUM('auto_generated', 'manual_override') NOT NULL DEFAULT 'manual_override',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES shift_teams(id) ON DELETE SET NULL,
  FOREIGN KEY (shift_type_id) REFERENCES shift_types(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_employee_roster_date (employee_id, roster_date),
  INDEX idx_rosters_employee (employee_id),
  INDEX idx_rosters_date (roster_date)
);

-- shift_swaps
CREATE TABLE shift_swaps (
  id CHAR(36) PRIMARY KEY,
  requester_employee_id CHAR(36) NOT NULL,
  target_employee_id CHAR(36) NOT NULL,
  requester_roster_id CHAR(36) NOT NULL,
  target_roster_id CHAR(36) NOT NULL,
  target_response ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  hr_approval ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (requester_employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (target_employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (requester_roster_id) REFERENCES shift_rosters(id) ON DELETE CASCADE,
  FOREIGN KEY (target_roster_id) REFERENCES shift_rosters(id) ON DELETE CASCADE,
  INDEX idx_swaps_requester (requester_employee_id),
  INDEX idx_swaps_target (target_employee_id)
);

-- attendance_logs: log kehadiran harian + hasil verifikasi wajah
CREATE TABLE attendance_logs (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  shift_roster_id CHAR(36) NULL,
  attendance_date DATE NOT NULL,

  check_in_time TIMESTAMP NULL,
  check_in_latitude DECIMAL(10, 8) NULL,
  check_in_longitude DECIMAL(11, 8) NULL,
  check_in_is_mock_location BOOLEAN DEFAULT FALSE,
  check_in_photo_path VARCHAR(255) NULL,
  check_in_matched_face_profile_id CHAR(36) NULL,
  check_in_face_confidence DECIMAL(5, 4) NULL,
  check_in_liveness_passed BOOLEAN NULL,
  check_in_status ENUM('ontime', 'late', 'flagged_outside_radius', 'flagged_face_mismatch') NULL,

  check_out_time TIMESTAMP NULL,
  check_out_latitude DECIMAL(10, 8) NULL,
  check_out_longitude DECIMAL(11, 8) NULL,
  check_out_is_mock_location BOOLEAN DEFAULT FALSE,
  check_out_photo_path VARCHAR(255) NULL,
  check_out_matched_face_profile_id CHAR(36) NULL,
  check_out_face_confidence DECIMAL(5, 4) NULL,
  check_out_liveness_passed BOOLEAN NULL,
  check_out_status ENUM('ok', 'early_leave', 'flagged_outside_radius', 'flagged_face_mismatch') NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (shift_roster_id) REFERENCES shift_rosters(id) ON DELETE SET NULL,
  FOREIGN KEY (check_in_matched_face_profile_id) REFERENCES employee_face_profiles(id) ON DELETE SET NULL,
  FOREIGN KEY (check_out_matched_face_profile_id) REFERENCES employee_face_profiles(id) ON DELETE SET NULL,
  UNIQUE KEY uq_employee_attendance_date (employee_id, attendance_date),
  INDEX idx_attendance_employee (employee_id),
  INDEX idx_attendance_date (attendance_date)
);
```

### D. Cuti & Lembur

```sql
-- leave_types
CREATE TABLE leave_types (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  default_quota INT NOT NULL CHECK (default_quota >= 0),
  is_paid BOOLEAN DEFAULT TRUE,
  requires_document BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- leave_balances [BARU]: sisa kuota per karyawan per tahun
CREATE TABLE leave_balances (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  leave_type_id CHAR(36) NOT NULL,
  year YEAR NOT NULL,
  initial_quota DECIMAL(5, 1) NOT NULL,
  remaining_quota DECIMAL(5, 1) NOT NULL,

  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_balance_employee_type_year (employee_id, leave_type_id, year)
);

-- leaves
CREATE TABLE leaves (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  leave_type_id CHAR(36) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days DECIMAL(4, 1) NOT NULL, -- sudah mempertimbangkan national_holidays
  reason TEXT NOT NULL,
  attachment_path VARCHAR(255) NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE RESTRICT,
  INDEX idx_leaves_employee (employee_id),
  CONSTRAINT chk_leave_dates CHECK (end_date >= start_date)
);

CREATE TABLE overtimes (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  overtime_date DATE NOT NULL,
  planned_hours DECIMAL(4, 2) NOT NULL CHECK (planned_hours > 0),
  claimed_hours DECIMAL(4, 2) NULL CHECK (claimed_hours >= 0),
  validated_hours DECIMAL(4, 2) NULL, -- hasil cocok dengan attendance_logs
  reason VARCHAR(255) NOT NULL,
  pre_approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  claim_status ENUM('none', 'pending', 'needs_review', 'approved', 'rejected') DEFAULT 'none',
  calculated_pay DECIMAL(12, 2) DEFAULT 0.00 CHECK (calculated_pay >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY uq_employee_overtime_date (employee_id, overtime_date),
  INDEX idx_overtimes_employee (employee_id)
);

-- overtime_rate_rules [BARU]
CREATE TABLE overtime_rate_rules (
  id CHAR(36) PRIMARY KEY,
  day_type ENUM('working_day', 'holiday') NOT NULL,
  hour_from INT NOT NULL,
  hour_to INT NULL,
  multiplier DECIMAL(4, 2) NOT NULL,
  effective_from DATE NOT NULL
);
```

### E. Rekrutmen

```sql
CREATE TABLE jobs (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  department_id CHAR(36) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  status ENUM('draft', 'open', 'closed') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  INDEX idx_jobs_dept (department_id)
);

CREATE TABLE candidates (
  id CHAR(36) PRIMARY KEY,
  job_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NULL,
  cv_path VARCHAR(255) NOT NULL,
  status ENUM('applied', 'screening', 'interview', 'offered', 'hired', 'rejected') DEFAULT 'applied',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  INDEX idx_candidates_job (job_id)
);

CREATE TABLE interviews (
  id CHAR(36) PRIMARY KEY,
  candidate_id CHAR(36) NOT NULL,
  interviewer_id CHAR(36) NOT NULL, -- references users.id
  interview_date DATETIME NOT NULL,
  notes TEXT NULL,
  status ENUM('scheduled', 'completed', 'canceled') DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  FOREIGN KEY (interviewer_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_interviews_candidate (candidate_id)
);
```

### F. Aset

```sql
CREATE TABLE assets (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  serial_number VARCHAR(100) NOT NULL UNIQUE,
  category ENUM('IT', 'Vehicle', 'Office Equipment') NOT NULL,
  purchase_date DATE NULL,
  `condition` ENUM('new', 'good', 'broken') DEFAULT 'new',
  status ENUM('available', 'assigned', 'under_repair', 'disposed') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE asset_assignments (
  id CHAR(36) PRIMARY KEY,
  asset_id CHAR(36) NOT NULL,
  employee_id CHAR(36) NOT NULL,
  assigned_date DATE NOT NULL,
  returned_date DATE NULL,
  condition_on_assignment ENUM('new', 'good', 'broken') NOT NULL,
  condition_on_return ENUM('new', 'good', 'broken') NULL,
  status ENUM('active', 'returned') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE RESTRICT,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  INDEX idx_assignments_asset (asset_id),
  INDEX idx_assignments_employee (employee_id),
  CONSTRAINT chk_assignment_dates CHECK (returned_date IS NULL OR returned_date >= assigned_date)
);

CREATE TABLE asset_damage_reports (
  id CHAR(36) PRIMARY KEY,
  asset_id CHAR(36) NOT NULL,
  employee_id CHAR(36) NOT NULL,
  report_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  description TEXT NOT NULL,
  photo_path VARCHAR(255) NULL,
  status ENUM('pending', 'reviewed', 'resolved') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE RESTRICT,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  INDEX idx_damage_reports_asset (asset_id),
  INDEX idx_damage_reports_employee (employee_id)
);

-- asset_handover_forms [BARU]
CREATE TABLE asset_handover_forms (
  id CHAR(36) PRIMARY KEY,
  asset_assignment_id CHAR(36) NOT NULL,
  document_path VARCHAR(255) NOT NULL,
  signature_path VARCHAR(255) NOT NULL,
  signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (asset_assignment_id) REFERENCES asset_assignments(id) ON DELETE CASCADE,
  INDEX idx_handover_assignment (asset_assignment_id)
);
```

### G. Kinerja

```sql
CREATE TABLE kpi_templates (
  id CHAR(36) PRIMARY KEY,
  position_id CHAR(36) NOT NULL,
  name VARCHAR(150) NOT NULL,
  weight_percentage INT NOT NULL CHECK (weight_percentage BETWEEN 1 AND 100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE,
  INDEX idx_kpi_templates_pos (position_id)
);

CREATE TABLE performance_evaluations (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  period VARCHAR(20) NOT NULL,
  attendance_score DECIMAL(5, 2) NOT NULL DEFAULT 100.00 CHECK (attendance_score BETWEEN 0 AND 100),
  self_score DECIMAL(5, 2) NOT NULL CHECK (self_score BETWEEN 0 AND 100),
  manager_score DECIMAL(5, 2) NOT NULL CHECK (manager_score BETWEEN 0 AND 100),
  final_score DECIMAL(5, 2) NOT NULL CHECK (final_score BETWEEN 0 AND 100),
  hr_notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY uq_employee_eval_period (employee_id, period),
  INDEX idx_evaluations_employee (employee_id)
);
```

### H. Payroll

```sql
-- payroll_periods [BARU]
CREATE TABLE payroll_periods (
  id CHAR(36) PRIMARY KEY,
  period_label VARCHAR(20) NOT NULL UNIQUE, -- misal "2026-08"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('draft', 'reviewed', 'finalized') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE payrolls (
  id CHAR(36) PRIMARY KEY,
  payroll_period_id CHAR(36) NOT NULL,
  employee_id CHAR(36) NOT NULL,
  basic_salary DECIMAL(12, 2) NOT NULL CHECK (basic_salary >= 0),
  allowance_total DECIMAL(12, 2) DEFAULT 0.00 CHECK (allowance_total >= 0),
  late_deduction DECIMAL(12, 2) DEFAULT 0.00 CHECK (late_deduction >= 0),
  unpaid_leave_deduction DECIMAL(12, 2) DEFAULT 0.00 CHECK (unpaid_leave_deduction >= 0),
  overtime_pay DECIMAL(12, 2) DEFAULT 0.00 CHECK (overtime_pay >= 0),
  bpjs_kesehatan_deduction DECIMAL(12, 2) DEFAULT 0.00,
  bpjs_jht_deduction DECIMAL(12, 2) DEFAULT 0.00,
  bpjs_jkk_deduction DECIMAL(12, 2) DEFAULT 0.00,
  bpjs_jkm_deduction DECIMAL(12, 2) DEFAULT 0.00,
  bpjs_jp_deduction DECIMAL(12, 2) DEFAULT 0.00,
  tax_pph21 DECIMAL(12, 2) DEFAULT 0.00 CHECK (tax_pph21 >= 0),
  net_salary DECIMAL(12, 2) NOT NULL CHECK (net_salary >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (payroll_period_id) REFERENCES payroll_periods(id) ON DELETE RESTRICT,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY uq_employee_payroll_period (employee_id, payroll_period_id),
  INDEX idx_payrolls_employee (employee_id)
);

-- tax_rate_table [BARU]
CREATE TABLE tax_rate_table (
  id CHAR(36) PRIMARY KEY,
  ter_category VARCHAR(10) NOT NULL, -- "A","B","C" sesuai skema TER
  income_lower_bound DECIMAL(14, 2) NOT NULL,
  income_upper_bound DECIMAL(14, 2) NULL,
  rate_percentage DECIMAL(5, 2) NOT NULL,
  effective_from DATE NOT NULL
);

-- bpjs_rate_table [BARU]
CREATE TABLE bpjs_rate_table (
  id CHAR(36) PRIMARY KEY,
  bpjs_type ENUM('kesehatan', 'jht', 'jkk', 'jkm', 'jp') NOT NULL,
  employee_percentage DECIMAL(5, 2) NOT NULL,
  company_percentage DECIMAL(5, 2) NOT NULL,
  salary_cap DECIMAL(14, 2) NULL,
  effective_from DATE NOT NULL
);

-- payslips [BARU]
CREATE TABLE payslips (
  id CHAR(36) PRIMARY KEY,
  payroll_id CHAR(36) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (payroll_id) REFERENCES payrolls(id) ON DELETE CASCADE
);
```

### I. Spatie Permission (tetap seperti draft Anda)

```sql
CREATE TABLE roles (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  guard_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  UNIQUE KEY uq_role_guard (name, guard_name)
);

CREATE TABLE permissions (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  guard_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  UNIQUE KEY uq_permission_guard (name, guard_name)
);

CREATE TABLE model_has_permissions (
  permission_id CHAR(36) NOT NULL,
  model_type VARCHAR(255) NOT NULL,
  model_id CHAR(36) NOT NULL,
  PRIMARY KEY (permission_id, model_id, model_type),
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  INDEX idx_model_has_permissions_model (model_id, model_type)
);

CREATE TABLE model_has_roles (
  role_id CHAR(36) NOT NULL,
  model_type VARCHAR(255) NOT NULL,
  model_id CHAR(36) NOT NULL,
  PRIMARY KEY (role_id, model_id, model_type),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  INDEX idx_model_has_roles_model (model_id, model_type)
);

CREATE TABLE role_has_permissions (
  permission_id CHAR(36) NOT NULL,
  role_id CHAR(36) NOT NULL,
  PRIMARY KEY (permission_id, role_id),
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  INDEX idx_role_has_permissions_role (role_id)
);

CREATE TABLE personal_access_tokens (
  id CHAR(36) PRIMARY KEY,
  tokenable_type VARCHAR(255) NOT NULL,
  tokenable_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  token VARCHAR(64) NOT NULL UNIQUE,
  abilities TEXT NULL,
  last_used_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_tokenable (tokenable_type, tokenable_id)
);
```

---

## 5. Perubahan Utama Dibanding Skema yang Anda Upload

| Area | Sebelum | Sesudah |
|---|---|---|
| Face recognition | `face_embedding TEXT` di tabel `employees` | Tabel terpisah `employee_face_profiles`, mendukung riwayat & consent PDP |
| Lokasi/geofence | Koordinat menempel di `departments` | Tabel `office_locations` terpisah + `employee_location_history` |
| Shift/roster | Tabel `rosters` sederhana (1 baris = 1 hari, tanpa tim) | `shift_teams`, `shift_team_members`, `shift_rotation_patterns` + `shift_rosters` yang bisa auto-generate massal per tim |
| Kalender libur | Belum ada | `national_holidays`, dipakai lintas modul |
| Cuti | `leave_types.default_quota` statis, tidak melacak sisa kuota individu | `leave_balances` per karyawan per tahun |
| Approval cuti | Status tunggal `pending/approved/rejected` | 
| Lembur | `calculated_pay` dihitung tanpa tabel rujukan tarif | `overtime_rate_rules` sebagai konfigurasi |
| Payroll | `period` sebagai string, tanpa status proses keseluruhan | `payroll_periods` dengan status draft/reviewed/finalized |
| Tarif pajak/BPJS | Tidak ada tabel, kemungkinan hardcode di kode | `tax_rate_table`, `bpjs_rate_table` (skema TER, dapat diubah tanpa deploy) |
| Slip gaji | Belum ada tabel file | `payslips` |
| Aset | Belum ada bukti serah terima | `asset_handover_forms` |
| Audit | Belum ada | `audit_logs` generik lintas modul |

---

## 6. Catatan Performa (tetap berlaku)
- Gunakan **UUIDv7** via `HasUuids` Laravel 11 agar clustered index tidak terfragmentasi.
- Semua kolom FK sudah diberi index eksplisit.
- Kombinasi `UNIQUE KEY` dipertahankan untuk mencegah duplikasi data harian/periode (absensi, roster, payroll).