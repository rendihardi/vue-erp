# API Contract Documentation - Modul 04: Manajemen Cuti & Izin

Dokumen ini mendokumentasikan spesifikasi lengkap endpoint, parameter, request payload, serta contoh response JSON untuk kondisi **Sukses (200/201)** dan **Gagal (400/401/403/404/422/500)** pada **Modul 04: Manajemen Cuti & Izin** (Leave Types, Balances, Leave Requests, 1-Level HR Approval, Calendar).

---

## 1. Kebijakan Jenis Cuti (Leave Types)

### 1.1 List Jenis Cuti (Terpaginasi)
* **Endpoint:** `GET /api/v1/leave-types/paginated`
* **Query Parameters:** `page` (int), `per_page` (int, default: 10)
* **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Data jenis cuti terpaginasi berhasil diambil.",
    "data": {
      "data": [
        {
          "id": "019fdb08-407f-727b-a01f-28923f37ce41",
          "name": "Cuti Tahunan",
          "code": "CT-THN",
          "quota": 12,
          "requires_attachment": false,
          "is_paid": true
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

## 2. Pengajuan Cuti (Leave Requests)

### 2.1 Ajukan Cuti Baru (Karyawan)
* **Endpoint:** `POST /api/v1/leaves/request`
* **Headers:** `Content-Type: multipart/form-data`
* **Form Parameters:**
  * `leave_type_id` (uuid, required)
  * `start_date` (date: YYYY-MM-DD, required)
  * `end_date` (date: YYYY-MM-DD, required)
  * `reason` (string, required)
  * `attachment` (file image/pdf, opsional/wajib sesuai jenis cuti)
* **Response Sukses (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "message": "Pengajuan cuti berhasil dikirim.",
    "data": {
      "id": "019fdb08-407f-727b-a01f-28923f37ce77",
      "leave_type": "Cuti Tahunan",
      "start_date": "2026-08-10",
      "end_date": "2026-08-11",
      "total_days": 2,
      "status": "pending"
    }
  }
  ```
* **Response Gagal Kuota Tidak Cukup (HTTP 400 Bad Request):**
  ```json
  {
    "success": false,
    "message": "Sisa kuota cuti Anda tidak mencukupi (Sisa: 1 hari, Mengajukan: 2 hari).",
    "data": null
  }
  ```

### 2.2 Persetujuan Direct 1-Level HR Admin
* **Endpoint:** `POST /api/v1/leaves/approve/{id}`
* **Path Parameters:** `id` (uuid, leave_request_id)
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
    "message": "Pengajuan cuti berhasil disetujui dan kuota terpotong.",
    "data": {
      "id": "019fdb08-407f-727b-a01f-28923f37ce77",
      "status": "approved"
    }
  }
  ```
* **Response Gagal (HTTP 404 Not Found):**
  ```json
  {
    "success": false,
    "message": "Pengajuan cuti tidak ditemukan.",
    "data": null
  }
  ```
