# Class Connect — Public Educational Notes-Sharing Platform

Class Connect is a modern, responsive, production-oriented web application where learners and educators can upload class notes, share educational materials, browse study resources, and download documents.

---

## 🌟 Key Features

- **Public Educational Library**: Browse lecture notes, slides, typed cheat sheets, and reference links organized by subject, unit, topic, and date.
- **Support for 7 Resource Types**:
  - Documents: PDF, DOC, DOCX
  - Images: PNG, JPG, JPEG
  - Typed Notes: Formatted rich text notes
  - External Resources: Educational video links & reference website links
- **Secure Anonymous Deletion**: No student account creation required. When notes are published, a cryptographically secure 64-character deletion credential is generated and issued once to the uploader. Notes can only be removed by verifying this credential against its stored SHA-256 hash in constant time.
- **Private Supabase Storage**: Uploaded files reside in a private bucket; downloads are authorized on demand via short-lived signed URLs.
- **Advanced Querying**: Search across title, description, subject, and topic with real-time multi-filter sorting and pagination.
- **Glassmorphism UI**: High-contrast, slate-dark educational theme with responsive layouts for mobile, tablet, and desktop.

---

## 🚀 Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v3 with glassmorphic panels
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Forms & Validation**: React Hook Form + Zod
- **Deployment**: Vercel

### Backend
- **Framework**: FastAPI (Python 3.13)
- **Database**: PostgreSQL (Supabase) with SQLAlchemy 2.0
- **Migrations**: Alembic
- **Storage**: Supabase Storage (Private bucket)
- **Rate Limiting**: Slowapi (IP-based limits on upload, download, and deletion)
- **Logging**: Structlog
- **Testing**: Pytest & HTTPX TestClient
- **Deployment**: Render

---

## 📁 Repository Structure

```text
classroom/
├── frontend/                     # React + Vite application
│   ├── src/
│   │   ├── components/           # Common, layout, and notes UI widgets
│   │   ├── pages/                # Home, Browse, Upload, and Detail pages
│   │   ├── services/             # API client
│   │   ├── types/                # TypeScript interfaces
│   │   └── utils/                # Formatters and style helpers
│   ├── package.json
│   ├── vercel.json
│   └── vite.config.ts
├── backend/                      # FastAPI Python service
│   ├── app/
│   │   ├── api/routes/           # Health, Notes, Subjects endpoints
│   │   ├── core/                 # Config, security, file validation, logging
│   │   ├── db/                   # Database session and Base
│   │   ├── models/               # SQLAlchemy models (Note, ResourceType)
│   │   ├── schemas/              # Pydantic validation models
│   │   ├── repositories/         # Database queries and filters
│   │   ├── services/             # Business logic & upload lifecycle
│   │   └── storage/              # Supabase storage driver
│   ├── migrations/               # Alembic database migrations
│   ├── tests/                    # Pytest test suite
│   ├── requirements.txt
│   └── alembic.ini
├── docs/                         # Project architecture & deployment guides
│   ├── architecture.md
│   ├── database-schema.md
│   ├── api-documentation.md
│   └── deployment.md
├── .gitignore
└── README.md
```

---

## ⚙️ Local Development Setup

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate   # On Windows
# source venv/bin/activate # On Unix

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL database URL & Supabase credentials

# Run database migrations
alembic upgrade head

# Run backend tests
pytest -v

# Start development server
uvicorn asgi:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start development server
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔒 Security Architecture

- **Deletion Tokens**: Generated via `secrets.token_urlsafe(48)` with constant-time verification (`hmac.compare_digest`).
- **File Validation**: Content inspection (magic byte validation for images and PDF headers), size caps, and filename sanitization.
- **SSRF Mitigation**: Disallow non-HTTPS schemes for external links (`javascript:`, `file:`, etc.).
- **Private Buckets**: Internal storage path is never returned in client API payloads.

## 🚀 Production Deployment

See [docs/deployment.md](docs/deployment.md) for the Supabase setup, Render Blueprint deployment, Vercel configuration, required environment variables, and post-deployment checks. The Render Blueprint uses the paid Starter plan because Render only supports pre-deploy migrations on paid web services.
