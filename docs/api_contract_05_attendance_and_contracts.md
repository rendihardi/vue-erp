# API Contract Documentation - Modul 05: Absensi & Kontrak Karyawan

Dokumen ini mendokumentasikan spesifikasi lengkap endpoint, parameter, request payload, serta contoh response JSON untuk kondisi **Sukses (200/201)** dan **Gagal (400/401/403/404/422/500)** pada **Modul 05: Absensi & Kontrak Karyawan** (Geofencing GPS, Face Recognition, Check-in/out, History, Employee Contracts).

---

## 1. Absensi GPS Geofencing & Biometrik Wajah

### 1.1 Check-In Absensi
* **Endpoint:** `POST /api/v1/attendance/check-in`
* **Headers:** `Content-Type: multipart/form-data`, `Authorization: Bearer <token>`
* **Form Parameters:**
  * `latitude` (numeric, required)
  * `longitude` (numeric, required)
  * `selfie_image` (file jpeg/png, required)
  * `notes` (string, opsional)
* **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Absensi masuk berhasil dicatat.",
    "data": {
      "id": "019fdb08-407f-727b-a01f-28923f37ce55",
      "date": "2026-08-07",
      "check_in_time": "08:02:15",
      "status": "present",
      "is_late": false,
      "late_minutes": 0,
      "face_confidence": 0.95
    }
  }
  ```
* **Response Gagal Di Luar Radius Geofence (HTTP 422 Unprocessable Entity):**
  ```json
  {
    "success": false,
    "message": "Anda berada di luar radius kantor cabang (Jarak: 320m, Maksimal: 100m).",
    "data": null
  }
  ```
* **Response Gagal Biometrik Wajah Tidak Cocok (HTTP 400 Bad Request):**
  ```json
  {
    "success": false,
    "message": "Verifikasi wajah gagal: Wajah tidak cocok dengan profil biometrik terdaftar.",
    "data": null
  }
  ```

### 1.2 Check-Out Absensi
* **Endpoint:** `POST /api/v1/attendance/check-out`
* **Headers:** `Content-Type: multipart/form-data`
* **Form Parameters:** `latitude`, `longitude`, `selfie_image`, `notes`
* **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Absensi pulang berhasil dicatat.",
    "data": {
      "id": "019fdb08-407f-727b-a01f-28923f37ce55",
      "check_out_time": "17:05:00",
      "work_duration_minutes": 542
    }
  }
  ```

---

## 2. Kontrak Kerja Karyawan (Employee Contracts)

### 2.1 List Kontrak Kerja (Terpaginasi)
* **Endpoint:** `GET /api/v1/contracts/paginated`
* **Query Parameters:** `page` (int), `per_page` (int, default: 10)
* **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Data kontrak terpaginasi berhasil diambil.",
    "data": {
      "data": [
        {
          "id": "019fdb08-407f-727b-a01f-28923f37ce66",
          "contract_number": "CTR/2026/001",
          "contract_type": "PKWT",
          "start_date": "2026-01-01",
          "end_date": "2026-12-31",
          "status": "active"
        }
      ]
    }
  }
  ```
