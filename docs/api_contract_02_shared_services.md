# API Contract Documentation - Modul 02: Shared Services & Audit Logs

Dokumen ini mendokumentasikan spesifikasi lengkap endpoint, parameter, request payload, serta contoh response JSON untuk kondisi **Sukses (200/201)** dan **Gagal (400/401/403/404/422/500)** pada **Modul 02: Shared Services & Audit** (Hari Libur Nasional, Riwayat Penempatan Cabang, Biometrik Wajah & PDP Consent, Audit Logs).

---

## 1. Hari Libur Nasional & Kalender Perusahaan (National Holidays)

### 1.1 List Libur Nasional (Terpaginasi)
* **Endpoint:** `GET /api/v1/national-holidays/paginated`
* **Headers:** `Authorization: Bearer <token>`
* **Query Parameters:** `page` (int), `per_page` (int, default: 10), `year` (int, opsional)
* **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Daftar libur nasional terpaginasi berhasil diambil.",
    "data": {
      "data": [
        {
          "id": "019fdb08-407f-727b-a01f-28923f37ce11",
          "name": "Hari Kemerdekaan RI Ke-81",
          "date": "2026-08-17",
          "is_mass_leave": false,
          "description": "HUT Kemerdekaan Republik Indonesia"
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

### 1.2 Tambah Hari Libur Nasional
* **Endpoint:** `POST /api/v1/national-holidays`
* **Request Body:**
  ```json
  {
    "name": "Hari Raya Idul Fitri 1447 Hijriah",
    "date": "2026-03-20",
    "is_mass_leave": false,
    "description": "Hari Raya Idul Fitri"
  }
  ```
* **Response Sukses (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "message": "Hari libur nasional berhasil ditambahkan.",
    "data": {
      "id": "019fdb08-407f-727b-a01f-28923f37ce12",
      "name": "Hari Raya Idul Fitri 1447 Hijriah",
      "date": "2026-03-20",
      "is_mass_leave": false
    }
  }
  ```
* **Response Gagal Duplikasi Tanggal (HTTP 400 Bad Request):**
  ```json
  {
    "success": false,
    "message": "The date has already been taken.",
    "data": null
  }
  ```

---

## 2. Audit Logs (Jejak Aktivitas Sistem)

### 2.1 List Log Aktivitas Sistem (Terpaginasi)
* **Endpoint:** `GET /api/v1/audit-logs`
* **Query Parameters:** `page` (int), `per_page` (int, default: 15), `module` (string), `action` (string), `search` (string)
* **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Daftar audit log berhasil diambil.",
    "data": {
      "current_page": 1,
      "data": [
        {
          "id": "019fdb08-407f-727b-a01f-28923f37ce99",
          "user_id": "019fdb08-407f-727b-a01f-28923f37ceeb",
          "user_name": "Super Admin ERP",
          "module": "LEAVE",
          "action": "APPROVE",
          "description": "Menyetujui pengajuan cuti Budi Setiawan",
          "ip_address": "127.0.0.1",
          "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "created_at": "2026-08-07T07:27:00.000000Z"
        }
      ],
      "per_page": 15,
      "total": 1
    }
  }
  ```

---

## 3. Biometrik Wajah & Kepatuhan UU PDP (Face Profile)

### 3.1 Detail Status Profil Wajah & Consent
* **Endpoint:** `GET /api/v1/employees/{id}/face-profile`
* **Path Parameters:** `id` (uuid, employee_id)
* **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Profil biometrik wajah berhasil diambil.",
    "data": {
      "id": "019fdb08-407f-727b-a01f-28923f37ce88",
      "employee_id": "019fdb08-407f-727b-a01f-28923f37ceec",
      "consent_given": true,
      "consent_date": "2026-08-01 10:00:00",
      "is_active": true
    }
  }
  ```
* **Response Gagal (HTTP 404 Not Found):**
  ```json
  {
    "success": false,
    "message": "Profil wajah tidak ditemukan.",
    "data": null
  }
  ```
