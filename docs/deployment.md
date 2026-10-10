# Class Connect — Production Deployment Guide

## 1. Supabase Setup (Database & Storage)

1. **Create Supabase Project**:
   - Create an organization and new project at [supabase.com](https://supabase.com).
   - Retrieve your Project URL (`https://[REF].supabase.co`) and Database Connection string (under Project Settings -> Database).

2. **Configure Private Storage Bucket**:
   - Go to **Storage** -> **New Bucket**.
   - Name the bucket `class-connect-files`.
   - **Crucial**: Ensure `Public bucket` is turned **OFF**. Class Connect maintains private bucket status and authorizes downloads via server-generated signed URLs.
   - Set maximum file size: `50MB`.

3. **Retrieve Service Role Secret**:
   - Go to **Settings** -> **API**.
   - Copy the `service_role` secret (keep this confidential; only configure it in the Render backend environment).

---

## 2. Backend Deployment on Render

1. **Create New Web Service**:
   - Connect your GitHub repository to [render.com](https://render.com).
   - Set **Root Directory**: `backend`
   - Set **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && alembic upgrade head`
   - **Start Command**: `uvicorn asgi:app --host 0.0.0.0 --port $PORT`

2. **Configure Environment Variables**:
   ```env
   DATABASE_URL=postgresql+psycopg2://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres?sslmode=require
   SUPABASE_URL=https://[REF].supabase.co
   SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]
   SUPABASE_STORAGE_BUCKET=class-connect-files
   CORS_ALLOWED_ORIGINS=https://class-connect.vercel.app
   MAX_UPLOAD_SIZE_MB=50
   RATE_LIMIT_UPLOAD=10/minute
   RATE_LIMIT_DELETE=5/minute
   RATE_LIMIT_DOWNLOAD=60/minute
   ENVIRONMENT=production
   SECRET_KEY=[A_RANDOM_LONG_STRING]
   ```

3. **Verify Health Check**:
   - Set Health Check Path in Render: `/api/v1/health`

---

## 3. Frontend Deployment on Vercel

1. **Import Repository**:
   - Go to [vercel.com](https://vercel.com) and click **Add New...** -> **Project**.
   - Select the GitHub repository.

2. **Configure Build Settings**:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Configure Environment Variables**:
   ```env
   VITE_API_BASE_URL=https://class-connect-api.onrender.com/api/v1
   ```

4. **SPA Rewrite Configuration**:
   Create or verify `frontend/vercel.json` to route all path requests to `index.html`:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
