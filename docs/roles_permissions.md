# Rancangan Peran & Izin Akses (Roles & Permissions)

Dokumen ini menjelaskan rancangan pembagian peran (*roles*) dan hak akses (*permissions*) menggunakan paket Spatie Laravel Permission pada sistem ERP.

---

## 1. Daftar Peran (Roles)
Sistem memiliki 4 peran utama:
1.  **Admin (Super Admin)**: Memiliki kendali penuh terhadap seluruh sistem ERP, termasuk konfigurasi global dan penghapusan data penting.
2.  **HR (HR Admin)**: Mengelola administrasi kepegawaian (karyawan, departemen, jabatan) serta melakukan persetujuan umum (cuti, lembur, shift).
3.  **Manager (Kepala Divisi)**: Melihat daftar karyawan di departemen terkait, menyetujui request internal tim, serta melihat laporan absensi divisi.
4.  **Employee (Karyawan Staff)**: Melakukan aktivitas kerja harian (absensi mobile, melihat profil, mengajukan cuti, lembur, dan melihat slip gaji).

---

## 2. Matriks Hak Akses (Permissions Matrix)

| Fitur | Hak Akses (Permission) | Admin | HR | Manager | Employee |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Departemen** | `view_departments` | v | v | v | v |
| | `create_departments` | v | v | - | - |
| | `edit_departments` | v | v | - | - |
| | `delete_departments` | v | - | - | - |
| **Jabatan** | `view_positions` | v | v | v | v |
| | `create_positions` | v | v | - | - |
| | `edit_positions` | v | v | - | - |
| | `delete_positions` | v | - | - | - |
| **Karyawan** | `view_employees` | v | v | v | - |
| | `create_employees` | v | v | - | - |
| | `edit_employees` | v | v | - | - |
| | `delete_employees` | v | - | - | - |
| **Absensi** | `view_attendances` | v | v | v | - |
| | `log_attendance` | v | - | - | v |
| **Cuti** | `apply_leave` | - | - | - | v |
| | `approve_leave` | v | v | v | - |
| **Lembur** | `apply_overtime` | - | - | - | v |
| | `approve_overtime` | v | v | v | - |

---

## 3. Implementasi Kode Seeder

Saat dijalankan, seeder [DatabaseSeeder.php](file:///c:/laragon/www/ERP/database/seeders/DatabaseSeeder.php) akan mendaftarkan seluruh permission dan mengaitkannya ke masing-masing role:

*   **Admin**: Diberikan seluruh hak akses secara otomatis.
*   **HR**: Diberikan hak akses administratif kecuali menghapus departemen, jabatan, dan karyawan (hanya Admin yang bisa menghapus).
*   **Manager**: Hak akses melihat tim (`view_employees`, `view_attendances`) dan persetujuan pengajuan (`approve_leave`, `approve_overtime`).
*   **Employee**: Hak akses mengajukan permohonan (`apply_leave`, `apply_overtime`) dan mencatat kehadiran (`log_attendance`).
