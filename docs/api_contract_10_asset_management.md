# API Contract Documentation - Modul 10: Manajemen Aset (Asset Management)

Dokumen ini mendokumentasikan spesifikasi lengkap endpoint, parameter, request payload, serta contoh response JSON untuk kondisi **Sukses (200/201)** dan **Gagal (400/401/403/404/422/500)** pada **Modul 10: Manajemen Aset (Asset Management)** (Inventaris Aset, Serah Terima/Pengembalian, Tiket Laporan Kerusakan).

---

## 1. Master Data Inventaris Aset (Assets)

### 1.1 List Aset (Terpaginasi)
* **Endpoint:** `GET /api/v1/assets/paginated`
* **Query Parameters:** `page` (int), `per_page` (int, default: 10)
* **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Data aset terpaginasi berhasil diambil.",
    "data": {
      "data": [
        {
          "id": "019fdb08-407f-727b-a01f-28923f37ce88",
          "name": "MacBook Pro M3 Max 16 inch",
          "serial_number": "MBP-2026-001",
          "category": "IT",
          "condition": "good",
          "status": "assigned"
        }
      ]
    }
  }
  ```

---

## 2. Laporan Kerusakan Aset (Damage Reports)

### 2.1 Laporkan Kerusakan Aset (Karyawan)
* **Endpoint:** `POST /api/v1/assets/damage-reports`
* **Headers:** `Content-Type: multipart/form-data`
* **Form Parameters:**
  * `asset_id` (uuid, required)
  * `description` (string, required)
  * `photo` (file image, opsional)
* **Response Sukses (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "message": "Laporan kerusakan aset berhasil dikirim.",
    "data": {
      "id": "019fdb08-407f-727b-a01f-28923f37ce99",
      "asset_name": "MacBook Pro M3 Max 16 inch",
      "status": "pending"
    }
  }
  ```
