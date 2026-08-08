# API Contract Documentation - Modul 07: Penggajian (Payroll Engine)

Dokumen ini mendokumentasikan spesifikasi lengkap endpoint, parameter, request payload, serta contoh response JSON untuk kondisi **Sukses (200/201)** dan **Gagal (400/401/403/404/422/500)** pada **Modul 07: Penggajian (Payroll Engine)** (Master Komponen Gaji, Assign Gaji, Payroll Run Bulanan, Slip Gaji).

---

## 1. Payroll Run Massal Bulanan

### 1.1 Jalankan Kalkulasi Massal (Payroll Run)
* **Endpoint:** `POST /api/v1/payroll/run`
* **Headers:** `Authorization: Bearer <token>` (Auth: Admin/HR)
* **Request Body:**
  ```json
  {
    "month": 8,
    "year": 2026
  }
  ```
* **Response Sukses (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "message": "Kalkulasi payroll periode 8/2026 selesai diproses.",
    "data": {
      "id": "019fdb08-407f-727b-a01f-28923f37ce88",
      "month": 8,
      "year": 2026,
      "status": "draft",
      "total_employees": 25,
      "total_take_home_pay": 215450000
    }
  }
  ```
* **Response Gagal Periode Sudah Rilis (HTTP 400 Bad Request):**
  ```json
  {
    "success": false,
    "message": "Payroll periode 8/2026 sudah difinalisasi dan dirilis. Tidak dapat diproses ulang.",
    "data": null
  }
  ```

### 1.2 Rilis Payroll (Finalisasi & Publikasi Slip Gaji)
* **Endpoint:** `POST /api/v1/payroll/runs/{id}/release`
* **Path Parameters:** `id` (uuid, payroll_run_id)
* **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Payroll run berhasil dirilis. Slip gaji kini dapat diakses oleh karyawan.",
    "data": {
      "id": "019fdb08-407f-727b-a01f-28923f37ce88",
      "status": "released"
    }
  }
  ```

---

## 2. Slip Gaji Karyawan (Payslips)

### 2.1 Slip Gaji Saya (Mobile App)
* **Endpoint:** `GET /api/v1/payroll/my-slips`
* **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Daftar slip gaji berhasil diambil.",
    "data": [
      {
        "id": "019fdb08-407f-727b-a01f-28923f37ce99",
        "period": "Juli 2026",
        "basic_salary": 8000000,
        "overtime_pay": 450000,
        "total_earnings": 9250000,
        "total_deductions": 520000,
        "net_salary": 8730000
      }
    ]
  }
  ```
