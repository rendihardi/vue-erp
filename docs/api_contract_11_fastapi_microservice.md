# API Contract Documentation - Modul 11: FastAPI Face Recognition Microservice

Dokumen ini mendokumentasikan spesifikasi API microservice **FastAPI Biometric Engine** (`/register-face` & `/verify-face`).

---

## 1. Endpoint Registrasi Wajah (Face Embeddings Extraction)

- **URL:** `POST /register-face` (Microservice FastAPI)
- **Request (Multipart Form-Data):**
    - `employee_id` (string, required)
    - `model_version` (string, optional, default: `"insightface-buffalo_l-v1"`)
    - `file` (image jpeg/png, required)
- **Response (HTTP 200 OK):**
    ```json
    {
        "status": "success",
        "message": "Face registered successfully for employee EMP-00001.",
        "employee_id": "EMP-00001",
        "face_profile_id": "d3b07384-d113-424a-80c7-4560d210515e",
        "embedding_length": 512
    }
    ```

---

## 2. Endpoint Verifikasi Wajah Presensi (Face Matching Verification)

- **URL:** `POST /verify-face` (Microservice FastAPI)
- **Request (Multipart Form-Data):**
    - `employee_id` (string, required)
    - `file` (image selfie absensi, required)
- **Response Sukses (HTTP 200 OK):**
    ```json
    {
        "status": "success",
        "is_match": true,
        "confidence": 0.95,
        "threshold": 0.6,
        "matched_face_profile_id": "d3b07384-d113-424a-80c7-4560d210515e"
    }
    ```
