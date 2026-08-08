# API Contract Documentation - Modul 09: Penilaian Kinerja (Performance/KPI)

Dokumen ini mendokumentasikan spesifikasi lengkap endpoint, parameter, request payload, serta contoh response JSON untuk kondisi **Sukses (200/201)** dan **Gagal (400/401/403/404/422/500)** pada **Modul 09: Penilaian Kinerja (Performance/KPI)** (Periode Penilaian, Self Assessment, Manager Rating, Scorecards & Grade A-E).

---

## 1. Periode Evaluasi Kinerja (Performance Periods)

### 1.1 Buka Periode Baru
* **Endpoint:** `POST /api/v1/performance/periods`
* **Headers:** `Authorization: Bearer <token>` (Auth: Admin/HR)
* **Request Body:**
  ```json
  {
    "name": "Quarter 3 2026",
    "type": "quarterly",
    "start_date": "2026-07-01",
    "end_date": "2026-09-30"
  }
  ```
* **Response Sukses (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "message": "Periode penilaian kinerja berhasil dibuka.",
    "data": {
      "id": "019fdb08-407f-727b-a01f-28923f37ce44",
      "name": "Quarter 3 2026",
      "type": "quarterly",
      "status": "open"
    }
  }
  ```

---

## 2. Rating & Finalisasi Scorecard

### 2.1 Finalisasi & Rilis Nilai Akhir (Grade A-E)
* **Endpoint:** `POST /api/v1/performance/reviews/{id}/release`
* **Path Parameters:** `id` (uuid, performance_review_id)
* **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Penilaian kinerja berhasil difinalisasi dan dirilis.",
    "data": {
      "id": "019fdb08-407f-727b-a01f-28923f37ce55",
      "self_score": 4.5,
      "manager_score": 4.2,
      "final_score": 87.0,
      "grade": "A",
      "status": "released"
    }
  }
  ```
* **Response Gagal Belum Dinilai Manager (HTTP 400 Bad Request):**
  ```json
  {
    "success": false,
    "message": "Penilaian atasan/manager belum diisi. Tidak dapat meriwayat nilai akhir.",
    "data": null
  }
  ```
