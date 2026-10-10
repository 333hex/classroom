# Class Connect — REST API Documentation

Base URL: `/api/v1`

---

### 1. Health Check
- **Endpoint**: `GET /api/v1/health`
- **Description**: Returns database and private storage connectivity status.
- **Response**: `200 OK`
  ```json
  {
    "status": "ok",
    "database": true,
    "storage": true,
    "version": "1.0.0"
  }
  ```

---

### 2. List & Search Notes
- **Endpoint**: `GET /api/v1/notes`
- **Query Parameters**:
  - `page` (int, default: 1): Page number
  - `page_size` (int, default: 20, max: 100): Results per page
  - `search` (string): Search query matching title, subject, topic, or description
  - `subject` (string): Filter by specific subject
  - `resource_type` (string): Filter by format (`pdf`, `doc`, `docx`, `image`, `typed`, `video_link`, `website_link`)
  - `unit_number` (int): Filter by unit
  - `class_date` (date, YYYY-MM-DD): Filter by lecture date
  - `sort` (string, `newest` or `oldest`, default: `newest`)
- **Response**: `200 OK`
  ```json
  {
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "title": "Quantum Physics - Wave Functions",
        "description": "Lecture 4 notes on wave-particle duality.",
        "subject": "Physics",
        "unit_number": 2,
        "topic": "Schrodinger Equation",
        "class_date": "2026-03-15",
        "resource_type": "pdf",
        "original_filename": "wave_functions.pdf",
        "mime_type": "application/pdf",
        "file_size": 240510,
        "created_at": "2026-03-16T10:00:00Z",
        "updated_at": "2026-03-16T10:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 20,
    "total_pages": 1
  }
  ```

---

### 3. Upload Note
- **Endpoint**: `POST /api/v1/notes`
- **Content-Type**: `multipart/form-data`
- **Rate Limit**: 10 requests / minute
- **Form Fields**:
  - `title` (string, required): Title of the note (2–255 chars)
  - `subject` (string, required): Subject name (1–100 chars)
  - `resource_type` (string, required): Format type
  - `description` (string, optional)
  - `unit_number` (int, optional)
  - `topic` (string, optional)
  - `class_date` (date, optional)
  - `typed_content` (string, required if `resource_type` is `typed`)
  - `external_url` (string, required if `resource_type` is `video_link` or `website_link`)
  - `file` (binary file, required if `resource_type` is file-based)
- **Response**: `201 Created`
  ```json
  {
    "note": { ...NoteResponse... },
    "deletion_token": "kL94qX_...64-char-token..."
  }
  ```

---

### 4. Note Details
- **Endpoint**: `GET /api/v1/notes/{note_id}`
- **Response**: `200 OK` or `404 Not Found`

---

### 5. Download Resource
- **Endpoint**: `GET /api/v1/notes/{note_id}/download`
- **Rate Limit**: 60 requests / minute
- **Response**: `200 OK`
  ```json
  {
    "download_url": "https://[project-ref].supabase.co/storage/v1/object/sign/...token..."
  }
  ```

---

### 6. Delete Note
- **Endpoint**: `POST /api/v1/notes/{note_id}/delete`
- **Rate Limit**: 5 requests / minute
- **Body**:
  ```json
  {
    "deletion_token": "kL94qX_...64-char-token..."
  }
  ```
- **Response**: `200 OK` on success, `403 Forbidden` on invalid credential.

---

### 7. Distinct Subjects
- **Endpoint**: `GET /api/v1/subjects`
- **Response**: `200 OK`
  ```json
  {
    "subjects": ["Biology", "Chemistry", "Mathematics", "Physics"],
    "total": 4
  }
  ```
