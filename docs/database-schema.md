# Database Schema & Data Integrity Design

## PostgreSQL Database (Managed via Supabase)

Database migrations are managed using **Alembic** (`backend/migrations`).

### Schema Definition: `notes` Table

| Column Name | Type | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, `gen_random_uuid()` | Unique resource identifier |
| `title` | `VARCHAR(255)` | `NOT NULL`, Index | Note title |
| `description` | `TEXT` | `NULLABLE` | Optional summary of the note |
| `subject` | `VARCHAR(100)` | `NOT NULL`, Index | Academic subject name |
| `unit_number` | `INTEGER` | `NULLABLE` | Course unit number |
| `topic` | `VARCHAR(200)` | `NULLABLE`, Index | Specific lecture topic or concept |
| `class_date` | `DATE` | `NULLABLE` | Date lecture or class was conducted |
| `resource_type` | `ENUM` | `NOT NULL`, Index | `pdf`, `doc`, `docx`, `image`, `typed`, `video_link`, `website_link` |
| `typed_content` | `TEXT` | `NULLABLE` | Raw notes text for typed format |
| `external_url` | `VARCHAR(2048)`| `NULLABLE` | External HTTPS reference or video link |
| `storage_path` | `VARCHAR(1024)`| `NULLABLE` | Path in private Supabase bucket |
| `original_filename` | `VARCHAR(500)` | `NULLABLE` | Sanitized original uploaded filename |
| `mime_type` | `VARCHAR(100)` | `NULLABLE` | Detected MIME content type |
| `file_size` | `INTEGER` | `NULLABLE` | File size in bytes |
| `deletion_token_hash`| `VARCHAR(64)` | `NOT NULL` | SHA-256 digest of private deletion token |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Row insertion timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Row last-modified timestamp |

### Check Constraints

1. **`ck_notes_has_content`**:
   Ensures that every note record contains at least one concrete content source:
   ```sql
   (typed_content IS NOT NULL) OR (external_url IS NOT NULL) OR (storage_path IS NOT NULL)
   ```
2. **`ck_notes_external_url_scheme`**:
   Guarantees that external links must use the secure HTTPS protocol:
   ```sql
   (external_url IS NULL) OR (external_url LIKE 'https://%')
   ```

### Indexes

- `ix_notes_title`: Fast title lookups and text matching.
- `ix_notes_subject`: Filtering by educational course or subject.
- `ix_notes_topic`: Sub-topic filtering.
- `ix_notes_resource_type`: Filtering by format type (e.g. PDF, Typed).
- `ix_notes_created_at`: Chronological sorting (`newest`/`oldest`).
- `ix_notes_subject_resource_type`: Composite index for common browse queries.
