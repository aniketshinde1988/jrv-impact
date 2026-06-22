# Deploying to Railway or Render

Both platforms work the same way for this project: two services built from
Dockerfiles (`backend/Dockerfile`, `frontend/Dockerfile`) plus one managed
Postgres database. Neither platform runs `docker-compose.yml` directly, so
you create the services individually through their dashboards.

The backend self-creates its database schema on first boot (see
`backend/Data/schema.sql`), so there's no manual migration step.

> Because the backend and frontend land on two different subdomains on these
> platforms (unlike the VPS, where one nginx serves both), you'll do this in
> two passes: deploy the backend, note its URL, then deploy the frontend
> pointed at it, then come back and tell the backend the frontend's URL too
> (for CORS). That circular dependency is normal for a first deploy.

---

## Option A: Render

### 1. Push this project to a GitHub repo
Render deploys from a repo, not a zip upload.

### 2. Create the database
Dashboard → **New → PostgreSQL**. Free tier is fine to try it out. Once
created, copy its **Internal Database URL** (looks like
`postgres://user:pass@host/dbname`).

### 3. Create the backend service
Dashboard → **New → Web Service** → connect your repo.
- **Runtime**: Docker
- **Root Directory**: `backend`
- **Dockerfile Path**: `backend/Dockerfile`
- **Environment variables**:
  | Key | Value |
  |---|---|
  | `DATABASE_URL` | the Internal Database URL from step 2 |
  | `Jwt__Key` | a long random string |
  | `Jwt__Issuer` | `JrvImpact` |
  | `Jwt__Audience` | `JrvImpactClient` |
  | `Seed__AdminPassword` | a password for the seeded `admin` login |
  | `Cors__AllowedOrigins__0` | leave blank for now, fill in after step 4 |

Deploy it. Once live, copy its public URL, e.g.
`https://jrv-impact-backend.onrender.com`.

### 4. Create the frontend service
Dashboard → **New → Web Service** → same repo.
- **Runtime**: Docker
- **Root Directory**: `frontend`
- **Dockerfile Path**: `frontend/Dockerfile`
- **Environment variables**:
  | Key | Value |
  |---|---|
  | `VITE_API_URL` | `https://jrv-impact-backend.onrender.com/api` (your backend URL from step 3, plus `/api`) |

Render passes environment variables matching a Dockerfile `ARG` name through
as build arguments automatically for Docker-runtime services — that's what
picks up `VITE_API_URL` at build time. If your build logs show the app was
built with an empty API URL, check Render's current docs for "Docker build
arguments," since dashboard wording occasionally changes.

Deploy it. Copy its public URL too, e.g. `https://jrv-impact-frontend.onrender.com`.

### 5. Close the loop on CORS
Go back to the **backend** service → Environment → set
`Cors__AllowedOrigins__0` to the frontend URL from step 4 → save (this
triggers a redeploy).

### 6. Done
Visit the frontend URL. Log in with `admin` / whatever you set as
`Seed__AdminPassword`.

---

## Option B: Railway

### 1. Push this project to a GitHub repo

### 2. Create a project, add Postgres
Dashboard → **New Project** → **Provision PostgreSQL**. Railway exposes its
connection details as `${{Postgres.DATABASE_URL}}` for other services in the
same project to reference.

### 3. Add the backend service
**New → GitHub Repo** → pick your repo.
- **Settings → Source → Root Directory**: `backend`
- Railway should detect `backend/Dockerfile` automatically.
- **Variables**:
  | Key | Value |
  |---|---|
  | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (Railway's reference syntax — autocompletes in their UI) |
  | `Jwt__Key` | a long random string |
  | `Jwt__Issuer` | `JrvImpact` |
  | `Jwt__Audience` | `JrvImpactClient` |
  | `Seed__AdminPassword` | a password for the seeded `admin` login |
  | `Cors__AllowedOrigins__0` | leave blank for now |
- **Settings → Networking → Generate Domain** to get a public URL.

### 4. Add the frontend service
**New → GitHub Repo** → same repo again.
- **Settings → Source → Root Directory**: `frontend`
- **Variables**:
  | Key | Value |
  |---|---|
  | `VITE_API_URL` | `https://<your-backend-domain>/api` |
- Railway passes service variables through as Docker build args automatically
  when the Dockerfile declares a matching `ARG`, which `frontend/Dockerfile`
  already does for `VITE_API_URL`.
- **Settings → Networking → Generate Domain** for this service too.

### 5. Close the loop on CORS
Back on the **backend** service, set `Cors__AllowedOrigins__0` to the
frontend's public domain, then redeploy.

### 6. Done
Visit the frontend's Railway domain and log in as `admin`.

---

## A note on uploaded photos

On both platforms, the filesystem inside a container is ephemeral — anything
written to `wwwroot/uploads` disappears on redeploy unless you attach a
persistent volume (Railway supports volumes per service; Render's free tier
does not, only paid plans). For a real production deployment of the photo
feature, look at attaching a volume (Railway) or moving photo storage to
object storage like S3/R2 (a small change to `JobSheetsController.UploadPhoto`
to upload to a bucket instead of disk). The VPS / docker-compose path already
handles this correctly via the `jrv_uploads` named volume.
