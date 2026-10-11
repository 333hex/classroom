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

The repository includes a root-level `render.yaml` Blueprint. In Render, choose **New +** -> **Blueprint**, connect this repository, and let Render read the Blueprint. It configures the backend root directory, Python 3.12.10, build/start commands, database migration pre-deploy command, and `/api/v1/health` check. It uses the paid Starter plan because Render only supports pre-deploy commands on paid web services.

During Blueprint setup, provide these values when prompted:

```env
DATABASE_URL=postgresql+psycopg2://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres?sslmode=require
SUPABASE_URL=https://[REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]
CORS_ALLOWED_ORIGINS=https://[YOUR-VERCEL-DOMAIN]
```

Use the Supabase **direct** connection string if Render can reach it; otherwise use Supabase's session pooler connection string. Keep the SQLAlchemy driver prefix `postgresql+psycopg2://` and include `sslmode=require`. The Blueprint generates `SECRET_KEY` and sets production mode and the default storage bucket. The bucket must already exist and remain private.

If you later change the Vercel production domain, update `CORS_ALLOWED_ORIGINS` in the Render service environment to the exact origin (scheme and hostname, no trailing path). Add comma-separated origins only when additional production domains are needed.

---

## 3. Frontend Deployment on Vercel

1. **Import Repository**:
   - Go to [vercel.com](https://vercel.com) and click **Add New...** -> **Project**.
   - Select the GitHub repository.
   - Set the project **Root Directory** to `frontend`.

2. **Configure Build Settings**:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Configure the Production Environment Variable**:
   ```env
   VITE_API_BASE_URL=https://[YOUR-RENDER-SERVICE].onrender.com/api/v1
   ```

`frontend/vercel.json` already provides the SPA rewrite required for direct navigation to client-side routes. After the first deployment, copy the Render service origin into `CORS_ALLOWED_ORIGINS`, and the Render URL into Vercel's `VITE_API_BASE_URL`, then redeploy the frontend. If you enable Vercel preview deployments, add their origins to the backend CORS list and configure the Preview environment's API URL too.

## 4. Post-deployment checks

- Open `https://[YOUR-RENDER-SERVICE].onrender.com/api/v1/health`; it should return HTTP 200 with `database` and `storage` both `true`.
- Open the Vercel site, browse notes, and confirm a detail route works after refresh.
- Upload a small file and verify the resulting download works through the signed URL.
- Confirm the Supabase storage bucket is private and the service role key exists only in Render's environment settings.
