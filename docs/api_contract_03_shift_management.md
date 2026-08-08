# API Contract Documentation - Modul 03: Manajemen Shift & Roster

Dokumen ini mendokumentasikan spesifikasi lengkap endpoint, parameter, request payload, contoh response JSON (Sukses & Gagal), serta **Alur Sistem (Workflow Diagram)** dan **Aturan Bisnis (Business Rules)** untuk **Modul 03: Manajemen Shift & Roster**.

---

## 🏛️ Workflow Sistem & Aturan Bisnis (System Workflow & Business Rules)

### 1. Architectural Workflow Diagram (Hirarki Fitur)

```
Enterprise Shift & Roster Management System
│
├── 1. Master Shift Kerja (Shifts)
│      └── Mendefinisikan Jam Kerja (Shift Pagi, Shift Sore, Shift Malam, Grace Period)
│
├── 2. Pola Rotasi (Rotation Patterns) ⭐
│      ├── Mode 24/7 Rolling (Pabrik/RS/Tambang): "is_weekend_off": false -> HR wajib isi step OFF di sequence
│      └── Mode Kalender (Office/Support): "is_weekend_off": true -> Sabtu & Minggu otomatis OFF oleh backend
│
├── 3. Tim Shift (Shift Teams) ⭐
│      └── Pengelompokan Karyawan -> Endpoint /available-employees otomatis memfilter karyawan tanpa tim
│
├── 4. Roster Plan Bulanan ⭐⭐⭐
│      └── Perencanaan Bulanan -> Memilih Tim Shift + Memilih Pola Rotasi
│
├── 5. Schedule Assignment (Penetapan & Penyesuaian Jadwal)
│      ├── ⚡ Generate Massal (`POST /api/v1/roster-plans/{id}/generate`)
│      ├── 👥 Bulk Assign (`POST /api/v1/rosters/assign` -> Banyak karyawan, rentang tanggal)
│      ├── 👤 Individual Assign (`POST /api/v1/rosters/assign` -> 1 karyawan, rentang tanggal)
│      └── ✏️ Individual Adjustment (`PUT /api/v1/rosters/schedules/{id}` -> Override 1 sel tanggal)
│
├── 6. Visualisasi Kalender ⭐
│      ├── 📊 Roster Plan Matrix (`GET /api/v1/roster-plans/{id}/calendar` -> Grid 1 Bulan Tim)
│      └── 📅 Employee Calendar (`GET /api/v1/rosters/my-calendar` -> Kalender Bulanan Pribadi)
│
└── 7. Pertukaran Shift (Shift Swaps)
       └── 2-Stage Interaction: Karyawan A Pengajuan ↔ Karyawan B Respon -> HR Admin Approve
```

---

### 2. Standard Operating Business Rules (Aturan Bisnis Utama)

> [!IMPORTANT]
> **ATURAN BISNIS UTAMA ERP:**
>
> 1. **Proteksi Publikasi (Publish Rule)**:
>    - Roster Plan **TIDAK DAPAT dipublikasikan** jika belum di-generate (`shift_schedules` masih 0).
>    - Backend menolak request dengan `HTTP 400 Bad Request` dan pesan error eksplisit.
> 2. **Proteksi Riwayat Presensi (Past-Date Attendance Safeguard)**:
>    - Saat Roster Plan yang sedang berjalan di pertengahan bulan (_published_) di-generate ulang atau dihapus:
>    - **Jadwal Tanggal Lalu (`< hari ini`)**: **TETAP DIPELIHARA & TIDAK AKAN DIHAPUS/OVERWRITE** untuk menjaga keakuratan audit presensi & payroll.
>    - **Jadwal Tanggal Mendatang (`>= hari ini`)**: Diperbarui / dihapus secara otomatis.
> 3. **Proteksi Override Manual (Manual Override Lock)**:
>    - Setiap jadwal yang dibuat/diubah melalui **Bulk Assign**, **Individual Assign**, **Individual Adjustment**, atau **Shift Swap** otomatis diberi flag **`source: manual_override`**.
>    - Jadwal ber-flag `manual_override` **TERKUNCI AMAN** dan **TIDAK AKAN TERTIMPA** saat tombol `⚡ GENERATE` diklik.
> 4. **Aturan Mode Rotasi Weekend (`is_weekend_off`)**:
>    - **Mode 24/7 Rolling (`is_weekend_off: false`)**: Jam kerja berputar kontinu tanpa peduli hari kalender (Sabtu/Minggu bisa masuk). HR wajib memasukkan step OFF di urutan sequence.
>    - **Mode Kalender (`is_weekend_off: true`)**: Sabtu & Minggu otomatis di-set sebagai `is_day_off: true` oleh backend. HR tidak perlu memasukkan step OFF di sequence.
> 5. **Aturan Keanggotaan Tim (Single Team Membership)**:
>    - 1 Karyawan hanya boleh menjadi anggota aktif di **1 Tim Shift** pada waktu yang sama.
>    - Endpoint `GET /api/v1/shift-teams/available-employees` otomatis memfilter & hanya menyajikan karyawan yang belum punya tim.
> 6. **Ordering Roster Plan (Newest First)**:
>    - Endpoint `GET /api/v1/roster-plans` secara otomatis diurutkan berdasarkan **`created_at DESC`** sehingga Roster Plan yang paling baru dibuat selalu berada di urutan teratas.

---

## 1A. Master Shift Kerja (`/api/v1/shifts`)

### 1A.1 List Shift Kerja (Terpaginasi)

- **Endpoint:** `GET /api/v1/shifts/paginated`
- **Query Parameters:** `page` (int, default: 1), `per_page` (int, default: 10)
- **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Data shift terpaginasi berhasil diambil.",
    "data": {
      "data": [
        {
          "id": "019fdb08-407f-727b-a01f-28923f37ce31",
          "name": "Shift Pagi",
          "code": "SH-PGI",
          "start_time": "08:00",
          "end_time": "17:00",
          "grace_period_minutes": 15
        }
      ],
      "meta": {
        "current_page": 1,
        "from": 1,
        "last_page": 1,
        "per_page": 10,
        "to": 1,
        "total": 1
      }
    }
  }
  ```
- **Response Gagal Server Error (HTTP 500 Internal Server Error):**
  ```json
  {
    "success": false,
    "message": "Gagal mengambil data shift: Database connection timeout",
    "data": null
  }
  ```

### 1A.2 Buat Shift Baru

- **Endpoint:** `POST /api/v1/shifts`
- **Request Body:**
  ```json
  {
    "name": "Shift Pagi",
    "code": "SH-PGI",
    "start_time": "08:00",
    "end_time": "17:00",
    "grace_period_minutes": 15
  }
  ```
- **Response Sukses (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "message": "Master shift berhasil dibuat.",
    "data": {
      "id": "019fdb08-407f-727b-a01f-28923f37ce31",
      "name": "Shift Pagi",
      "code": "SH-PGI",
      "start_time": "08:00",
      "end_time": "17:00",
      "grace_period_minutes": 15
    }
  }
  ```
- **Response Gagal Validasi Input (HTTP 422 Unprocessable Entity):**
  ```json
  {
    "message": "The code field is required.",
    "errors": {
      "code": ["The code field is required."]
    }
  }
  ```

### 1A.3 Update Shift

- **Endpoint:** `PUT /api/v1/shifts/{id}`
- **Request Body:**
  ```json
  {
    "name": "Shift Pagi Operasional",
    "start_time": "07:30",
    "end_time": "16:30"
  }
  ```
- **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Master shift berhasil diperbarui.",
    "data": {
      "id": "019fdb08-407f-727b-a01f-28923f37ce31",
      "name": "Shift Pagi Operasional",
      "code": "SH-PGI",
      "start_time": "07:30",
      "end_time": "16:30"
    }
  }
  ```
- **Response Gagal Not Found (HTTP 404 Not Found):**
  ```json
  {
    "success": false,
    "message": "Shift tidak ditemukan.",
    "data": null
  }
  ```

### 1A.4 Hapus Shift

- **Endpoint:** `DELETE /api/v1/shifts/{id}`
- **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Master shift berhasil dihapus.",
    "data": null
  }
  ```
- **Response Gagal Not Found (HTTP 404 Not Found):**
  ```json
  {
    "success": false,
    "message": "Shift tidak ditemukan.",
    "data": null
  }
  ```

---

## 1B. Pola Rotasi (`/api/v1/rotation-patterns`)

### 1B.1 List Pola Rotasi (Terpaginasi & Filterable)

- **Endpoint:** `GET /api/v1/rotation-patterns`
- **Query Parameters:**
  - `page` (int, default: 1)
  - `per_page` (int, default: 10)
  - `search` (string, optional — filter nama pola rotasi)
  - `shift_team_id` (uuid, optional — filter berdasarkan Tim Shift)
- **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Daftar pola rotasi terpaginasi berhasil diambil.",
    "data": {
      "data": [
        {
          "id": "019fdb08-407f-727b-a01f-28923f37ce99",
          "shift_team_id": "019fdbe2-6149-7311-a82e-a16014fc82e0",
          "name": "Pola Rotasi Operasional 2-2-2-2",
          "rotation_sequence": [
            {
              "shift_id": "uuid-pagi",
              "is_day_off": false,
              "duration_days": 2,
              "is_weekend_off": false
            },
            {
              "shift_id": "uuid-sore",
              "is_day_off": false,
              "duration_days": 2,
              "is_weekend_off": false
            },
            {
              "shift_id": "uuid-malam",
              "is_day_off": false,
              "duration_days": 2,
              "is_weekend_off": false
            },
            {
              "shift_id": null,
              "is_day_off": true,
              "duration_days": 2,
              "is_weekend_off": false
            }
          ],
          "start_date": "2026-09-01T00:00:00.000000Z",
          "shift_team": {
            "id": "019fdbe2-6149-7311-a82e-a16014fc82e0",
            "name": "Tim Operational Alpha"
          }
        }
      ],
      "meta": {
        "current_page": 1,
        "from": 1,
        "last_page": 1,
        "per_page": 10,
        "to": 1,
        "total": 1
      }
    }
  }
  ```

### 1B.2 Buat Pola Rotasi (Per Tim Shift)

- **Endpoint:** `POST /api/v1/shift-teams/{teamId}/patterns`
- **Request Body:**
  ```json
  {
    "name": "Pola Rotasi Operasional 2-2-2-2",
    "start_date": "2026-09-01",
    "is_weekend_off": false,
    "rotation_sequence": [
      { "shift_id": "uuid-pagi", "is_day_off": false, "duration_days": 2 },
      { "shift_id": "uuid-sore", "is_day_off": false, "duration_days": 2 },
      { "shift_id": "uuid-malam", "is_day_off": false, "duration_days": 2 },
      { "shift_id": null, "is_day_off": true, "duration_days": 2 }
    ]
  }
  ```
- **Response Sukses (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "message": "Pola rotasi tim shift berhasil dibuat.",
    "data": {
      "id": "019fdb08-407f-727b-a01f-28923f37ce99",
      "shift_team_id": "019fdbe2-6149-7311-a82e-a16014fc82e0",
      "name": "Pola Rotasi Operasional 2-2-2-2",
      "rotation_sequence": [
        {
          "shift_id": "uuid-pagi",
          "is_day_off": false,
          "duration_days": 2,
          "is_weekend_off": false
        },
        {
          "shift_id": null,
          "is_day_off": true,
          "duration_days": 2,
          "is_weekend_off": false
        }
      ],
      "start_date": "2026-09-01"
    }
  }
  ```
- **Response Gagal Tim Tidak Ditemukan (HTTP 404 Not Found):**
  ```json
  {
    "success": false,
    "message": "Tim Shift tidak ditemukan. Silakan refresh halaman dan pilih Tim Shift yang aktif.",
    "data": null
  }
  ```

### 1B.3 Update Pola Rotasi

- **Endpoint:** `PUT /api/v1/rotation-patterns/{patternId}`
- **Request Body:**
  ```json
  {
    "name": "Pola Rotasi Operasional Updated",
    "is_weekend_off": true,
    "rotation_sequence": [
      { "shift_id": "uuid-pagi", "is_day_off": false, "duration_days": 5 },
      { "shift_id": null, "is_day_off": true, "duration_days": 2 }
    ]
  }
  ```
- **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Pola rotasi berhasil diperbarui.",
    "data": {
      "id": "019fdb08-407f-727b-a01f-28923f37ce99",
      "name": "Pola Rotasi Operasional Updated",
      "rotation_sequence": [
        {
          "shift_id": "uuid-pagi",
          "is_day_off": false,
          "duration_days": 5,
          "is_weekend_off": true
        },
        {
          "shift_id": null,
          "is_day_off": true,
          "duration_days": 2,
          "is_weekend_off": true
        }
      ]
    }
  }
  ```
- **Response Gagal Not Found (HTTP 404 Not Found):**
  ```json
  {
    "success": false,
    "message": "Pola Rotasi tidak ditemukan.",
    "data": null
  }
  ```

### 1B.4 Hapus Pola Rotasi

- **Endpoint:** `DELETE /api/v1/rotation-patterns/{patternId}`
- **Alias:** `DELETE /api/v1/shift-teams/patterns/{patternId}`
- **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Pola rotasi berhasil dihapus.",
    "data": null
  }
  ```
- **Response Gagal Not Found (HTTP 404 Not Found):**
  ```json
  {
    "success": false,
    "message": "Gagal menghapus pola rotasi: No query results for model [Modules\\HRCore\\Models\\ShiftRotationPattern]",
    "data": null
  }
  ```

---

## 1C. Tim Shift & Anggota (`/api/v1/shift-teams`)

### 1C.1 List Tim Shift

- **Endpoint:** `GET /api/v1/shift-teams`
- **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Daftar tim shift berhasil diambil.",
    "data": [
      {
        "id": "019fdbe2-6149-7311-a82e-a16014fc82e0",
        "name": "Tim Operational Alpha",
        "description": "Tim Shift Operasional Rotasi Pagi-Siang-Malam Group A",
        "active_members_count": 5
      }
    ]
  }
  ```

### 1C.2 Buat Tim Shift Baru

- **Endpoint:** `POST /api/v1/shift-teams`
- **Request Body:**
  ```json
  {
    "name": "Tim Operational Alpha",
    "description": "Tim Shift Operasional Rotasi Pagi-Siang-Malam Group A"
  }
  ```
- **Response Sukses (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "message": "Tim shift berhasil dibuat.",
    "data": {
      "id": "019fdbe2-6149-7311-a82e-a16014fc82e0",
      "name": "Tim Operational Alpha",
      "description": "Tim Shift Operasional Rotasi Pagi-Siang-Malam Group A"
    }
  }
  ```

### 1C.3 Tambah Anggota Tim

- **Endpoint:** `POST /api/v1/shift-teams/{id}/members`
- **Request Body:**
  ```json
  {
    "employee_id": "019fdb08-407f-727b-a01f-28923f37ce10",
    "joined_at": "2026-09-01"
  }
  ```
- **Response Sukses (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "message": "Anggota tim shift berhasil ditambahkan.",
    "data": {
      "id": "uuid-member",
      "shift_team_id": "019fdbe2-6149-7311-a82e-a16014fc82e0",
      "employee_id": "019fdb08-407f-727b-a01f-28923f37ce10",
      "joined_at": "2026-09-01"
    }
  }
  ```

### 1C.4 Daftar Karyawan Tersedia (Belum Memiliki Tim)

- **Endpoint:** `GET /api/v1/shift-teams/available-employees`
- **Query Parameters:** `search` (string, optional), `per_page` (int, default: 10)
- **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Daftar karyawan yang belum memiliki tim shift berhasil diambil.",
    "data": {
      "data": [
        {
          "id": "019fdb08-407f-727b-a01f-28923f37ce10",
          "nik": "EMP-00001",
          "name": "Budi Setiawan",
          "status": "active"
        }
      ],
      "meta": {
        "current_page": 1,
        "from": 1,
        "last_page": 1,
        "per_page": 10,
        "to": 1,
        "total": 1
      }
    }
  }
  ```

---

## 2. Enterprise Roster Planning (`/api/v1/roster-plans`)

### 2.1 List Roster Plan (Terpaginasi & Filterable)

- **Endpoint:** `GET /api/v1/roster-plans`
- **Ordering:** Automatically ordered by `created_at DESC`
- **Query Parameters:**
  - `page` (int, default: 1)
  - `per_page` (int, default: 9)
  - `search` (string, optional)
  - `status` (string, optional — `draft`, `published`, `locked`)
  - `shift_team_id` (uuid, optional)
  - `month` (string YYYY-MM, optional — contoh: `2026-09`)
- **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Daftar Roster Plan terpaginasi berhasil diambil.",
    "data": {
      "data": [
        {
          "id": "019fdb08-407f-727b-a01f-28923f37ceaa",
          "code": "RST-2026-09-PROD",
          "name": "Roster Operasional Pabrik September 2026",
          "period_start": "2026-09-01",
          "period_end": "2026-09-30",
          "status": "draft",
          "coverage_percentage": 97.45,
          "warning_count": 3
        }
      ],
      "meta": {
        "current_page": 1,
        "per_page": 9,
        "total": 1
      }
    }
  }
  ```

### 2.2 Buat Roster Plan Baru

- **Endpoint:** `POST /api/v1/roster-plans`
- **Request Body:**
  ```json
  {
    "code": "RST-2026-09-PROD",
    "name": "Roster Operasional Pabrik September 2026",
    "shift_team_id": "019fdbe2-6149-7311-a82e-a16014fc82e0",
    "rotation_pattern_id": "019fdb08-407f-727b-a01f-28923f37ce99",
    "period_start": "2026-09-01",
    "period_end": "2026-09-30"
  }
  ```
- **Response Sukses (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "message": "Roster Plan berhasil dibuat.",
    "data": {
      "id": "019fdb08-407f-727b-a01f-28923f37ceaa",
      "code": "RST-2026-09-PROD",
      "status": "draft"
    }
  }
  ```

### 2.3 Generate Roster Massal

- **Endpoint:** `POST /api/v1/roster-plans/{id}/generate`
- **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Berhasil meng-generate 155 entri roster harian. Coverage: 97.45%.",
    "data": {
      "created_count": 155,
      "report": {
        "coverage_percentage": 97.45,
        "total_warnings": 3,
        "warnings": []
      }
    }
  }
  ```
- **Response Gagal — Pola Rotasi Belum Diatur (HTTP 400 Bad Request):**
  ```json
  {
    "success": false,
    "message": "Pola rotasi belum diatur untuk tim ini. Silakan atur pola rotasi terlebih dahulu.",
    "data": null
  }
  ```

### 2.4 Validasi Kelengkapan (Soft Validation Engine Matrix)

- **Endpoint:** `POST /api/v1/roster-plans/{id}/validate`
- **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Validasi kelengkapan roster selesai diproses.",
    "data": {
      "roster_plan_id": "019fdb08-407f-727b-a01f-28923f37ceaa",
      "coverage_percentage": 97.45,
      "total_warnings": 3,
      "can_publish": true,
      "summary": {
        "missing_schedules": 1,
        "rest_time_violations": 1,
        "leave_conflicts": 1,
        "contract_expired": 0
      },
      "warnings": [
        {
          "code": "MISSING_SCHEDULE",
          "severity": "HIGH",
          "employee_id": "019fdb08-407f-727b-a01f-28923f37ce10",
          "employee_name": "Budi Setiawan",
          "date": "2026-09-15",
          "message": "Karyawan mode roster belum memiliki jadwal pada tanggal 15 Sep 2026."
        }
      ]
    }
  }
  ```

### 2.5 Publikasi Roster Plan (Publish Roster)

- **Endpoint:** `POST /api/v1/roster-plans/{id}/publish`
- **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Roster Plan berhasil dipublikasikan. Karyawan kini dapat melihat jadwal.",
    "data": {
      "id": "019fdb08-407f-727b-a01f-28923f37ceaa",
      "status": "published",
      "published_at": "2026-08-07T10:28:00.000000Z"
    }
  }
  ```
- **Response Gagal — Belum Di-Generate (HTTP 400 Bad Request):**
  ```json
  {
    "success": false,
    "message": "Roster Plan 'Roster September 2026' belum di-generate (jadwal masih kosong). Silakan klik tombol '⚡ GENERATE' terlebih dahulu sebelum mempublikasikan Roster Plan.",
    "data": null
  }
  ```

### 2.6 Kunci Roster Plan (Lock Roster)

- **Endpoint:** `POST /api/v1/roster-plans/{id}/lock`
- **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Roster Plan berhasil dikunci (Locked).",
    "data": {
      "id": "019fdb08-407f-727b-a01f-28923f37ceaa",
      "status": "locked"
    }
  }
  ```

### 2.7 Hapus Roster Plan (Delete Roster Plan)

- **Endpoint:** `DELETE /api/v1/roster-plans/{id}`
- **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Roster Plan dan seluruh entri jadwal harian terkait berhasil dihapus.",
    "data": null
  }
  ```
- **Response Gagal — Status Locked (HTTP 400 Bad Request):**
  ```json
  {
    "success": false,
    "message": "Roster Plan yang sudah dikunci (Locked) tidak dapat dihapus.",
    "data": null
  }
  ```

---

## 3. Pertukaran Shift (Shift Swaps - 2-Stage Interaction)

### 3.1 Pengajuan Tukar Shift (Karyawan)

- **Endpoint:** `POST /api/v1/shift-swaps`
- **Request Body:**
  ```json
  {
    "requested_employee_id": "019fdb08-407f-727b-a01f-28923f37ce10",
    "requester_date": "2026-08-10",
    "requested_date": "2026-08-12"
  }
  ```
- **Response Sukses (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "message": "Pengajuan pertukaran shift berhasil dikirim ke rekan kerja.",
    "data": {
      "id": "019fdb08-407f-727b-a01f-28923f37ce99",
      "status": "pending_peer"
    }
  }
  ```
- **Response Gagal — Permohonan Sudah Ada (HTTP 400 Bad Request):**
  ```json
  {
    "success": false,
    "message": "Permohonan pertukaran shift untuk jadwal tanggal ini sudah ada dan sedang diproses.",
    "data": null
  }
  ```

### 3.2 Respon Rekan Kerja (Tahap 1)

- **Endpoint:** `POST /api/v1/shift-swaps/{id}/respond`
- **Request Body:**
  ```json
  {
    "status": "accept",
    "rejection_reason": null
  }
  ```
- **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Respon pertukaran shift berhasil disimpan.",
    "data": {
      "id": "019fdb08-407f-727b-a01f-28923f37ce99",
      "status": "pending_hr"
    }
  }
  ```

### 3.3 Persetujuan Final HR Admin (Tahap 2)

- **Endpoint:** `POST /api/v1/shift-swaps/{id}/approve`
- **Request Body:**
  ```json
  {
    "status": "approved",
    "rejection_reason": null
  }
  ```
- **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Pertukaran shift berhasil disetujui. Roster kedua karyawan otomatis diperbarui.",
    "data": {
      "id": "019fdb08-407f-727b-a01f-28923f37ce99",
      "status": "approved"
    }
  }
  ```

### 3.4 Daftar Rekan Kerja Tersedia

- **Endpoint:** `GET /api/v1/shift-swaps/available-peers`
- **Query Parameters:** `date` (YYYY-MM-DD), `search` (optional), `page`, `per_page`
- **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Daftar rekan kerja yang tersedia berhasil diambil.",
    "data": {
      "data": [
        {
          "employee_id": "019fdb08-407f-727b-a01f-28923f37ce10",
          "nik": "EMP-00002",
          "employee_name": "Siti Rahma",
          "department_name": "Operasional Pabrik",
          "target_date": "2026-08-10",
          "shift": {
            "id": "019fdb08-407f-727b-a01f-28923f37ce32",
            "code": "SH-MLM",
            "name": "Shift Malam",
            "start_time": "23:00",
            "end_time": "07:00"
          }
        }
      ],
      "meta": {
        "current_page": 1,
        "from": 1,
        "last_page": 1,
        "per_page": 10,
        "to": 1,
        "total": 1
      }
    }
  }
  ```

### 3.5 Riwayat Pertukaran Shift Saya (Karyawan)

- **Endpoint:** `GET /api/v1/shift-swaps/me`
- **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Riwayat pertukaran shift berhasil diambil.",
    "data": [
      {
        "id": "019fdb08-407f-727b-a01f-28923f37ce99",
        "status": "approved",
        "requester_date": "2026-08-10",
        "requested_date": "2026-08-12"
      }
    ]
  }
  ```

### 3.6 List Seluruh Pertukaran Shift (HR Admin)

- **Endpoint:** `GET /api/v1/shift-swaps`
- **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Daftar pengajuan pertukaran shift berhasil diambil.",
    "data": {
      "data": [
        {
          "id": "019fdb08-407f-727b-a01f-28923f37ce99",
          "status": "pending_hr"
        }
      ],
      "meta": {
        "current_page": 1,
        "per_page": 15,
        "total": 1
      }
    }
  }
  ```

---

## 4. Calendar Visualizations (Kalender Kerja & Matriks Tim)

### 4.1 Kalender Kerja Bulanan Karyawan (`Employee Calendar`)

- **Endpoint:** `GET /api/v1/rosters/my-calendar`
- **Query Parameters:** `month` (string YYYY-MM, default: bulan berjalan)
- **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Kalender kerja bulanan pribadi berhasil diambil.",
    "data": {
      "month": "2026-08",
      "total_work_days": 22,
      "total_off_days": 9,
      "calendar": [
        {
          "date": "2026-08-01",
          "day_name": "Saturday",
          "is_day_off": true,
          "shift": null,
          "leave": null,
          "holiday": null
        },
        {
          "date": "2026-08-03",
          "day_name": "Monday",
          "is_day_off": false,
          "shift": {
            "id": "019fdb08-407f-727b-a01f-28923f37ce31",
            "name": "Shift Pagi",
            "start_time": "08:00:00",
            "end_time": "17:00:00",
            "color": "#3B82F6"
          },
          "leave": null,
          "holiday": null
        }
      ]
    }
  }
  ```

### 4.2 Kalender Matriks Roster Plan (`Roster Plan Calendar Matrix`)

- **Endpoint:** `GET /api/v1/roster-plans/{id}/calendar`
- **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Kalender matriks Roster Plan 'Roster September 2026' berhasil diambil.",
    "data": {
      "roster_plan_id": "019fdb08-407f-727b-a01f-28923f37ceaa",
      "roster_name": "Roster September 2026",
      "period_start": "2026-09-01",
      "period_end": "2026-09-30",
      "dates": ["2026-09-01", "2026-09-02", "2026-09-03"],
      "members_data": [
        {
          "employee_id": "019fdb08-407f-727b-a01f-28923f37ceec",
          "nik": "EMP-OPR-001",
          "name": "Bambang Triyono",
          "schedules": {
            "2026-09-01": {
              "is_day_off": false,
              "shift": {
                "id": "019fdb08-407f-727b-a01f-28923f37ce31",
                "name": "Shift Pagi",
                "start_time": "08:00",
                "end_time": "17:00"
              }
            },
            "2026-09-02": { "is_day_off": true, "shift": null }
          }
        }
      ]
    }
  }
  ```
- **Response Gagal Plan Tidak Ditemukan (HTTP 404 Not Found):**
  ```json
  {
    "success": false,
    "message": "Roster Plan tidak ditemukan.",
    "data": null
  }
  ```

### 4.3 Kalender Spesifik Karyawan untuk HR Admin

- **Endpoint:** `GET /api/v1/rosters/employee-calendar/{employee_id}`
- **Query Parameters:** `month` (string YYYY-MM, default: bulan berjalan)
- **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Kalender kerja karyawan Bambang Triyono berhasil diambil.",
    "data": {
      "employee": {
        "id": "019fdb08-407f-727b-a01f-28923f37ceec",
        "nik": "EMP-OPR-001",
        "name": "Bambang Triyono"
      },
      "month": "2026-08",
      "total_work_days": 22,
      "total_off_days": 9,
      "calendar": [
        {
          "date": "2026-08-01",
          "day_name": "Saturday",
          "is_day_off": true,
          "shift": null
        }
      ]
    }
  }
  ```

---

## 5. Schedule Assignment (Penetapan & Penyesuaian Jadwal)

### 5.1 Bulk Assign / Individual Assign (Rentang Tanggal)

- **Endpoint:** `POST /api/v1/rosters/assign`
- **Request Body:**
  ```json
  {
    "employee_ids": [
      "019fdb08-407f-727b-a01f-28923f37ce10",
      "019fdb08-407f-727b-a01f-28923f37ce11"
    ],
    "shift_id": "019fdb08-407f-727b-a01f-28923f37ce31",
    "start_date": "2026-09-01",
    "end_date": "2026-09-07"
  }
  ```
- **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Penetapan roster berhasil.",
    "data": null
  }
  ```
- **Response Gagal Validasi Input (HTTP 422 Unprocessable Entity):**
  ```json
  {
    "message": "The start_date field is required.",
    "errors": {
      "start_date": ["The start_date field is required."]
    }
  }
  ```

### 5.2 Individual Adjustment — Quick-Edit 1 Sel Tanggal

- **Endpoint:** `PUT /api/v1/rosters/schedules/{scheduleId}`
- **Alias:** `PUT /api/v1/shift-schedules/{scheduleId}`
- **Request Body:**
  ```json
  {
    "shift_id": "019fdb08-407f-727b-a01f-28923f37ce32",
    "is_day_off": false
  }
  ```
- **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Jadwal shift berhasil diperbarui.",
    "data": {
      "id": "uuid-schedule",
      "shift_id": "019fdb08-407f-727b-a01f-28923f37ce32",
      "is_day_off": false,
      "source": "manual_override"
    }
  }
  ```
- **Response Gagal Not Found (HTTP 404 Not Found):**
  ```json
  {
    "success": false,
    "message": "Jadwal shift tidak ditemukan.",
    "data": null
  }
  ```

### 5.3 List Roster / Jadwal Seluruh Perusahaan (HR Admin)

- **Endpoint:** `GET /api/v1/rosters`
- **Query Parameters:** `page` (int, default: 1), `per_page` (int, default: 15), `start_date` (string YYYY-MM-DD), `end_date` (string YYYY-MM-DD)
- **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Daftar roster berhasil diambil.",
    "data": {
      "data": [
        {
          "id": "uuid-schedule",
          "employee_id": "019fdb08-407f-727b-a01f-28923f37ce10",
          "schedule_date": "2026-09-01",
          "is_day_off": false,
          "source": "fixed",
          "shift": {
            "id": "019fdb08-407f-727b-a01f-28923f37ce31",
            "name": "Shift Pagi"
          }
        }
      ],
      "meta": {
        "current_page": 1,
        "per_page": 15,
        "total": 1
      }
    }
  }
  ```

### 5.4 Roster Saya Hari Ini (Karyawan)

- **Endpoint:** `GET /api/v1/rosters/today`
- **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Roster hari ini berhasil diambil.",
    "data": {
      "id": "uuid-schedule",
      "schedule_date": "2026-08-08",
      "is_day_off": false,
      "shift": {
        "id": "019fdb08-407f-727b-a01f-28923f37ce31",
        "name": "Shift Pagi",
        "start_time": "08:00",
        "end_time": "17:00"
      }
    }
  }
  ```

### 5.5 Daftar Roster Bulanan Saya (Karyawan)

- **Endpoint:** `GET /api/v1/rosters/me`
- **Query Parameters:** `start_date` (YYYY-MM-DD), `end_date` (YYYY-MM-DD)
- **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Daftar roster pribadi berhasil diambil.",
    "data": [
      {
        "id": "uuid-schedule",
        "schedule_date": "2026-08-08",
        "is_day_off": false,
        "shift": {
          "id": "019fdb08-407f-727b-a01f-28923f37ce31",
          "name": "Shift Pagi"
        }
      }
    ]
  }
  ```
