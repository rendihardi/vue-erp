# Product Requirement Document (PRD): Multi-Company Support (V1.0)

Dokumen ini mendefinisikan kebutuhan produk untuk pengembangan **Modul Multi-Company Support (Dukungan Multi-Tenant Perusahaan)**. Modul ini memungkinkan sistem ERP berjalan dengan skema multi-perusahaan/cabang dalam satu database tunggal, memastikan isolasi data aman bagi masing-masing perusahaan/cabang, serta mempermudah konsolidasi laporan bagi tingkat Holding/Super Admin.

---

## 1. Overview & Problem Statement

### Masalah Utama (The Complication)
1. **Keinginan Ekspansi Bisnis:** Pemilik bisnis (holding company) sering kali memiliki beberapa anak perusahaan atau kantor cabang yang berbeda entitas hukumnya, namun ingin mengelola seluruh operasional HR dalam satu sistem tunggal tanpa perlu membeli lisensi terpisah.
2. **Risiko Kebocoran Data (Data Security):** Karyawan atau admin di Perusahaan A tidak boleh melihat data gaji, aset, atau detail karyawan di Perusahaan B demi menjaga kerahasiaan informasi internal masing-masing entitas.
3. **Pengaturan Lokasi Absensi Cabang:** Setiap kantor cabang memiliki letak geografis yang berbeda, sehingga koordinat absensi GPS/Geofencing harus dapat diatur secara spesifik per cabang/perusahaan.

### Solusi & Dampak (The Resolution)
Mengimplementasikan struktur *multi-tenancy* tingkat database (menambahkan atribut `company_id` dan `branch_id` pada seluruh entitas kritis seperti karyawan, departemen, absensi, dan payroll). Menyediakan dashboard *Super Admin* berbasis web (*Vue.js*) untuk mengelola pendaftaran perusahaan baru dan menetapkan admin masing-masing perusahaan. Aplikasi mobile (*React Native*) secara otomatis beradaptasi menampilkan logo perusahaan dan aturan lokasi kantor tempat karyawan tersebut bernaung.

---

## 2. Metrik Keberhasilan (Success Metrics)

| Kategori Metrik | Target Keberhasilan | Cara Mengukur |
| :--- | :--- | :--- |
| **Keamanan Data** | 100% isolasi data sukses. Tidak ada kebocoran data antar perusahaan. | Pengujian penetrasi database dan verifikasi kueri API Laravel menggunakan *Global Scopes* yang menyaring data berdasarkan `company_id`. |
| **Kemudahan Scale-up** | Pendaftaran perusahaan/cabang baru selesai <5 menit oleh Super Admin. | Waktu pengisian form registrasi perusahaan baru di panel Super Admin. |
| **Akurasi Geofence Cabang** | Karyawan hanya bisa absen di cabang tempat mereka ditugaskan. | Verifikasi penugasan `branch_id` saat verifikasi koordinat GPS absensi. |

---

## 3. Struktur Hirarki Organisasi (Corporate Hierarchy)

Sistem akan dirancang mengikuti struktur hirarki berikut:

```
Holding Group (Pusat / Super Admin)
   └── Company / Anak Perusahaan (Company Admin)
          └── Branch / Kantor Cabang (Branch Manager)
                 └── Department (Manager / Supervisor)
                        └── Karyawan (Employee)
```

Setiap tingkatan memiliki batasan akses data yang terdefinisi dengan jelas melalui sistem *Role-Based Access Control (RBAC)*.

---

## 4. Profil Pengguna & Hak Akses (RBAC)

1.  **Super Admin (Holding Level):**
    *   Mengelola daftar perusahaan induk/anak di sistem.
    *   Mengatur modul aktif dan kapasitas lisensi pengguna per perusahaan.
    *   Melihat laporan konsolidasi makro seluruh perusahaan.
2.  **Company Admin (Company Level):**
    *   Mengelola profil spesifik perusahaan mereka (Nama, Logo, Warna Tema Aplikasi, NPWP Perusahaan).
    *   Mengatur daftar Cabang (*Branches*) dan menunjuk *Branch Manager*.
    *   Mengelola karyawan, payroll, dan inventaris internal perusahaan sendiri.
3.  **Branch Manager (Branch Level):**
    *   Mengelola operasional harian cabang terkait (Roster shift cabang, koordinat GPS geofence kantor cabang).
    *   Menyetujui cuti/lembur karyawan khusus cabang tersebut.
4.  **Employee (Karyawan):**
    *   Hanya dapat melihat data pribadinya sendiri. Aplikasi mobile mendeteksi parameter logo dan geofencing GPS sesuai penugasan kantor cabang mereka.

---

## 5. Ruang Lingkup Proyek (Project Scope)

### In-Scope (Fitur V1)
*   Manajemen entitas Multi-Company dan Multi-Branch.
*   Penerapan Global Scopes di Laravel untuk isolasi data otomatis (Query filtering berdasarkan `company_id` aktif).
*   Manajemen profil perusahaan (Upload Logo Perusahaan, Warna branding kustom).
*   Role-Based Access Control (RBAC) berjenjang (Super Admin, Company Admin, Branch Manager, Employee).
*   Validasi absensi geofencing berbasis lokasi cabang masing-masing karyawan.

### Out-of-Scope (Ditunda ke Fase Berikutnya)
*   **Transfer Aset Antar-Perusahaan:** Pemindahan aset inventaris dari Perusahaan A ke Perusahaan B secara otomatis lengkap dengan dokumen serah terima antar-badan hukum (V1 berasumsi aset dikembalikan dulu lalu didaftarkan ulang).
*   **Skema Server Terpisah (Database Per-Tenant):** Setiap perusahaan memiliki host database server fisik tersendiri. V1 sepenuhnya menggunakan skema *Shared Database, Isolated Rows* (satu database server untuk efisiensi biaya).
