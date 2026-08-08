# API Contract Documentation - Modul 06: Manajemen Lembur

Dokumen ini mendokumentasikan spesifikasi lengkap endpoint, parameter, request payload, serta contoh response JSON untuk kondisi **Sukses (200/201)** dan **Gagal (400/401/403/404/422/500)** pada **Modul 06: Manajemen Lembur** (Pre-Approval, Claim, 1-Level HR Approval, Depnaker Pay Calculation).

---

## 1. Pre-Approval & Claim Lembur (Karyawan)

### 1.1 Ajukan Rencana Lembur (Pre-Approval)
* **Endpoint:** `POST /api/v1/overtime/request`
* **Request Body:**
  ```json
  {
    "date": "2026-08-10",
    "planned_start": "17:00",
    "planned_end": "20:00",
    "reason": "Maintenance server bulanan & deployment"
  }
  ```
* **Response Sukses (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "message": "Pengajuan rencana lembur berhasil dikirim.",
    "data": {
      "id": "019fdb08-407f-727b-a01f-28923f37ce33",
      "date": "2026-08-10",
      "planned_hours": 3.0,
      "status": "pending_approval"
    }
  }
  ```

### 1.2 Klaim Lembur Aktual
* **Endpoint:** `POST /api/v1/overtime/{id}/claim`
* **Path Parameters:** `id` (uuid, overtime_request_id)
* **Request Body:**
  ```json
  {
    "actual_start": "17:00",
    "actual_end": "19:30",
    "work_report": "Deployment server selesai pukul 19.30"
  }
  ```
* **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Klaim lembur aktual berhasil dikirim.",
    "data": {
      "id": "019fdb08-407f-727b-a01f-28923f37ce33",
      "actual_hours": 2.5,
      "status": "claimed"
    }
  }
  ```
* **Response Gagal Melebihi Check-Out Absensi (HTTP 422 Unprocessable Entity):**
  ```json
  {
    "success": false,
    "message": "Jam selesai lembur (19:30) tidak boleh melebihi jam check-out presensi harian Anda (19:00).",
    "data": null
  }
  ```

---

## 2. Persetujuan HR Admin & Perhitungan Depnaker

### 2.1 Persetujuan Final HR Admin (1-Level Approval)
* **Endpoint:** `POST /api/v1/overtime/{id}/approve`
* **Request Body:**
  ```json
  {
    "status": "approved",
    "rejection_reason": null
  }
  ```
* **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Lembur berhasil disetujui. Upah lembur Depnaker dihitung sebesar Rp 187,500.",
    "data": {
      "id": "019fdb08-407f-727b-a01f-28923f37ce33",
      "status": "approved",
      "calculated_pay": 187500
    }
  }
  ```
