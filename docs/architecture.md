# Class Connect — System Architecture & Design

## 1. Overview
**Class Connect** is a responsive, production-oriented public educational notes-sharing platform. Visitors can upload, discover, preview, and download study materials, organized across subjects, units, topics, and dates.

To preserve privacy, Class Connect operates without student account requirements. Resource ownership and deletion authority are enforced using a **cryptographic, server-issued private deletion credential**.

---

## 2. System Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Vercel: Frontend                      │
│   React 19 + TypeScript + Vite + Tailwind CSS + Zod    │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / REST JSON
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Render: Backend                      │
│   FastAPI + Pydantic v2 + SQLAlchemy 2.0 + Slowapi     │
└───────────────┬─────────────────────────┬──────────────┘
                │ Pooler Connection        │ Private S3 API
                ▼                         ▼
┌────────────────────────────────┐ ┌────────────────────────────────┐
│      Supabase PostgreSQL       │ │        Supabase Storage        │
│   Metadata, Indexes, Hashes    │ │    Private Educational Docs    │
└────────────────────────────────┘ └────────────────────────────────┘
```

---

## 3. Security Highlights

1. **Anonymous Owner-Controlled Deletion**:
   - For every upload, the backend generates a 48-byte URL-safe cryptographic token (`secrets.token_urlsafe(48)`).
   - Only the SHA-256 hash is persisted in the PostgreSQL database.
   - The plain token is returned to the uploader exactly once over HTTPS.
   - Deletion requires submitting the token, verified in constant time (`hmac.compare_digest`).
   - Brute-force attacks are thwarted with IP-based rate limiting (`5/minute`).

2. **Private File Storage**:
   - The Supabase storage bucket is strictly private.
   - Downloads are authorized on-demand via short-lived signed URLs (default 300s TTL).
   - Internal storage keys/buckets are never leaked to frontend clients.

3. **Untrusted Upload Validation**:
   - Magic bytes / signature verification to prevent spoofed MIME headers.
   - Strict filename sanitization and safe server-generated storage paths.
   - SSRF protection: Disallow `file:`, `javascript:`, and non-HTTPS external URLs.
