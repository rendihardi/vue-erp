# API Contract Documentation - Modul 01: Master Data & HR Core

Dokumen ini mendokumentasikan secara lengkap rute, parameter, payload request, serta contoh response JSON untuk kondisi **Sukses (200/201)** dan **Gagal (400/401/403/404/422/500)** pada **Modul 01: Master Data & HR Core** (User Auth, Office Locations, Departments, Positions, Employees).

---

## 1. Standar Format Response JSON
Semua endpoint dalam modul ini menggunakan wrapper `ResponseHelper`.

### Response Sukses (Umum) - HTTP 200 OK / 201 Created
```json
{
  "success": true,
  "message": "Pesan status sukses tindakan.",
  "data": { ... }
}
```

### Response Sukses Terpaginasi - HTTP 200 OK
```json
{
  "success": true,
  "message": "Data terpaginasi berhasil diambil.",
  "data": {
    "data": [ ... ],
    "meta": {
      "current_page": 1,
      "from": 1,
      "last_page": 3,
      "path": "http://127.0.0.1:8000/api/v1/employees/paginated",
      "per_page": 10,
      "to": 10,
      "total": 25
    }
  }
}
```

### Response Gagal (Validasi / Bad Request) - HTTP 400 Bad Request / 422 Unprocessable Entity
```json
{
  "success": false,
  "message": "The email field is required. (and 1 more error)",
  "data": null
}
```

### Response Gagal (Otentikasi / Hak Akses) - HTTP 401 Unauthorized / 403 Forbidden
```json
{
  "success": false,
  "message": "Unauthenticated.",
  "data": null
}
```

### Response Gagal (Data Tidak Ditemukan) - HTTP 404 Not Found
```json
{
  "success": false,
  "message": "Data karyawan tidak ditemukan.",
  "data": null
}
```

---

## 2. Otentikasi (Auth)

### 2.1 Login User
* **Endpoint:** `POST /api/v1/auth/login`
* **Headers:** `Content-Type: application/json`, `Accept: application/json`
* **Request Body:**
  ```json
  {
    "email": "admin@erp.com",
    "password": "password123"
  }
  ```
* **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Login berhasil.",
    "data": {
      "access_token": "1|laravel_sanctum_token_string...",
      "token_type": "Bearer",
      "user": {
        "id": "019fdb08-407f-727b-a01f-28923f37ceeb",
        "name": "Super Admin ERP",
        "email": "admin@erp.com",
        "role": "admin",
        "employee": {
          "id": "019fdb08-407f-727b-a01f-28923f37ceec",
          "nik": "EMP-00001",
          "name": "Super Admin ERP",
          "department": "IT & Software Development",
          "position": "Lead Software Engineer"
        }
      }
    }
  }
  ```
* **Response Gagal (HTTP 401 Unauthorized):**
  ```json
  {
    "success": false,
    "message": "Kredensial yang Anda masukkan salah.",
    "data": null
  }
  ```

### 2.2 Profile User (Me)
* **Endpoint:** `GET /api/v1/auth/me`
* **Headers:** `Authorization: Bearer <token>`, `Accept: application/json`
* **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Profil pengguna berhasil diambil.",
    "data": {
      "user_id": "019fdb08-407f-727b-a01f-28923f37ceeb",
      "name": "Super Admin ERP",
      "email": "admin@erp.com",
      "roles": ["admin"]
    }
  }
  ```

---

## 3. Master Lokasi Kantor Cabang (Office Locations)

### 3.1 List Lokasi Cabang (Terpaginasi)
* **Endpoint:** `GET /api/v1/office-locations/paginated`
* **Headers:** `Authorization: Bearer <token>`
* **Query Parameters:** `page` (int), `per_page` (int, default: 10), `search` (string, opsional)
* **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Data lokasi kantor terpaginasi berhasil diambil.",
    "data": {
      "data": [
        {
          "id": "019fdb08-407f-727b-a01f-28923f37ceed",
          "name": "Kantor Pusat Surabaya",
          "address": "Jl. Pemuda No. 45, Surabaya",
          "latitude": -7.2654,
          "longitude": 112.7483,
          "radius_meters": 100,
          "is_active": true
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

### 3.2 Tambah Lokasi Cabang Baru
* **Endpoint:** `POST /api/v1/office-locations`
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "name": "Cabang Jakarta South",
    "address": "Jl. TB Simatupang No. 12, Jakarta",
    "latitude": -6.2915,
    "longitude": 106.8229,
    "radius_meters": 150,
    "is_active": true
  }
  ```
* **Response Sukses (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "message": "Lokasi kantor berhasil ditambahkan.",
    "data": {
      "id": "019fdb08-407f-727b-a01f-28923f37ceef",
      "name": "Cabang Jakarta South",
      "latitude": -6.2915,
      "longitude": 106.8229,
      "radius_meters": 150,
      "is_active": true
    }
  }
  ```
* **Response Gagal Validasi (HTTP 422 Unprocessable Entity):**
  ```json
  {
    "success": false,
    "message": "The latitude field must be a number.",
    "data": null
  }
  ```

---

## 4. Master Karyawan (Employees)

### 4.1 List Karyawan (Terpaginasi)
* **Endpoint:** `GET /api/v1/employees/paginated`
* **Query Parameters:** `page` (int), `per_page` (int), `search` (string), `department_id` (uuid), `position_id` (uuid)
* **Response Sukses (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Data karyawan terpaginasi berhasil diambil.",
    "data": {
      "data": [
        {
          "id": "019fdb08-407f-727b-a01f-28923f37ceec",
          "nik": "EMP-00001",
          "name": "Budi Setiawan",
          "email": "budi@company.com",
          "phone": "081234567890",
          "shift_mode": "fixed",
          "status": "active",
          "office_location": {
            "id": "019fdb08-407f-727b-a01f-28923f37ceed",
            "name": "Kantor Pusat Surabaya"
          },
          "department": {
            "id": "019fdb08-407f-727b-a01f-28923f37ceea",
            "name": "IT & Software Development"
          },
          "position": {
            "id": "019fdb08-407f-727b-a01f-28923f37ceeb",
            "name": "Software Engineer"
          }
        }
      ],
      "meta": {
        "current_page": 1,
        "from": 1,
        "last_page": 3,
        "per_page": 10,
        "to": 10,
        "total": 25
      }
    }
  }
  ```

### 4.2 Tambah Karyawan Baru
* **Endpoint:** `POST /api/v1/employees`
* **Request Body:**
  ```json
  {
    "nik": "EMP-00010",
    "name": "Siti Rahma",
    "email": "siti.rahma@company.com",
    "password": "Password123!",
    "phone": "081987654321",
    "department_id": "019fdb08-407f-727b-a01f-28923f37ceea",
    "position_id": "019fdb08-407f-727b-a01f-28923f37ceeb",
    "office_location_id": "019fdb08-407f-727b-a01f-28923f37ceed",
    "shift_mode": "fixed",
    "status": "active",
    "role": "employee"
  }
  ```
* **Response Sukses (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "message": "Karyawan dan akun pengguna berhasil dibuat.",
    "data": {
      "id": "019fdb08-407f-727b-a01f-28923f37cefa",
      "nik": "EMP-00010",
      "name": "Siti Rahma",
      "email": "siti.rahma@company.com",
      "shift_mode": "fixed"
    }
  }
  ```
* **Response Gagal Duplicate NIK/Email (HTTP 422 Unprocessable Entity):**
  ```json
  {
    "success": false,
    "message": "The email has already been taken.",
    "data": null
  }
  ```
