# API Contract Documentation - Modul 08: Rekrutmen & Onboarding (ATS)

Dokumen ini mendokumentasikan spesifikasi lengkap endpoint, parameter, request payload, serta contoh response JSON untuk kondisi **Sukses (200/201)** dan **Gagal (400/401/403/404/422/500)** pada **Modul 08: Rekrutmen & Onboarding (ATS)** (Lowongan Kerja, Pelamar Candidate Funnel, Jadwal Interview, Convert Onboarding Karyawan Baru).

---

## 1. Lowongan Pekerjaan (Job Vacancies)

### 1.1 List Lowongan Pekerjaan
* **Endpoint:** `GET /api/v1/recruitment/jobs`
* **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Daftar lowongan kerja berhasil diambil.",
    "data": [
      {
        "id": "019fdb08-407f-727b-a01f-28923f37ce11",
        "title": "Senior Backend Developer",
        "department": "IT & Software Development",
        "status": "open",
        "max_salary": 15000000
      }
    ]
  }
  ```

---

## 2. Onboarding Convert Candidate to Employee

### 2.1 Convert Candidate menjadi Karyawan Baru
* **Endpoint:** `POST /api/v1/recruitment/candidates/{id}/convert`
* **Path Parameters:** `id` (uuid, candidate_id)
* **Request Body:**
  ```json
  {
    "department_id": "019fdb08-407f-727b-a01f-28923f37ceea",
    "position_id": "019fdb08-407f-727b-a01f-28923f37ceeb",
    "office_location_id": "019fdb08-407f-727b-a01f-28923f37ceed",
    "shift_mode": "fixed",
    "nik": "EMP-00020",
    "phone": "081299998888",
    "password": "Password123!"
  }
  ```
* **Response Sukses (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "message": "Kandidat berhasil dikonversi menjadi karyawan baru.",
    "data": {
      "employee_id": "019fdb08-407f-727b-a01f-28923f37ce99",
      "nik": "EMP-00020",
      "name": "Budi Setiawan Candidate",
      "email": "candidate@gmail.com"
    }
  }
  ```
* **Response Gagal Sudah Dikategori Hired/Converted (HTTP 400 Bad Request):**
  ```json
  {
    "success": false,
    "message": "Kandidat ini sudah dikonversi atau berstatus hired sebelumnya.",
    "data": null
  }
  ```
