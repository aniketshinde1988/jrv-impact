# JRV Impact

Field service management app — Locations, Companies, Job Titles, Pre Job Sheets,
Job Sheets (with photo proof + WhatsApp share), and a one-click Excel report.

**Stack**: .NET 8 Web API + PostgreSQL + React (Vite) + Docker Compose.

---

## 1. Prerequisites on your VPS

- A VPS with Docker + Docker Compose installed (e.g. Hostinger KVM 1, or any
  Ubuntu 22.04+ box with ≥1 vCPU / 2GB RAM).
- If Docker isn't installed yet:
  ```bash
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  # log out and back in for the group change to take effect
  ```

## 2. Get the code onto the server

Copy/upload this whole folder to your VPS (e.g. via `scp`, `rsync`, or git),
then `cd` into it.

```bash
scp -r jrv-impact your-user@your-vps-ip:~/
ssh your-user@your-vps-ip
cd jrv-impact
```

## 3. Configure secrets

```bash
cp .env.example .env
nano .env
```

Fill in at minimum:
- `POSTGRES_PASSWORD` — a strong database password
- `JWT_KEY` — a long random string (`openssl rand -base64 48` is a good way to generate one)
- `ADMIN_PASSWORD` — the password for the seeded `admin` login (change it after first login anyway)
- `PUBLIC_URL` — the URL you'll reach the app at once it's live (used for CORS)

## 4. Build and start

```bash
docker compose up -d --build
```

First boot will:
1. Start Postgres and run `db/init.sql` to create the schema.
2. Start the backend, which waits for the database and seeds a default user:
   **User ID: `admin`**, password = whatever you set as `ADMIN_PASSWORD`.
3. Build and serve the frontend on port 80 (or `HTTP_PORT` from `.env`).

Visit `http://your-vps-ip` (or your domain once DNS/reverse proxy is set up).

Check logs any time with:
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

## 5. Put HTTPS in front of it (recommended)

The Compose setup above serves plain HTTP on port 80. For a real domain, put
a reverse proxy in front that handles TLS. The simplest option is
[Caddy](https://caddyserver.com/), which gets you free auto-renewing HTTPS
with a 5-line config:

```bash
sudo apt install -y caddy
sudo tee /etc/caddy/Caddyfile <<'EOF'
jrv.yourdomain.com {
    reverse_proxy localhost:80
}
EOF
sudo systemctl restart caddy
```

(Point your domain's A record at the VPS IP first.) Then update `PUBLIC_URL`
in `.env` to `https://jrv.yourdomain.com` and restart: `docker compose up -d`.

Alternatively, use Nginx + Certbot if you prefer that stack.

## 6. First login & next steps

1. Log in as `admin` with the password you set.
2. Go to **Master → Location** and create your locations (e.g. Mumbai Central,
   short code `MB`) — you'll need at least one before you can do anything else.
3. Add Companies (with reference persons) and Job Titles.
4. You're ready to create Pre Job Sheets → Generate → Job Sheets.

## 7. Backups

The database lives in the `jrv_pgdata` Docker volume; uploaded photos live in
`jrv_uploads`. Back both up regularly, e.g.:

```bash
# Database dump
docker compose exec db pg_dump -U jrv_user jrv_impact > backup-$(date +%F).sql

# Uploaded photos
docker run --rm -v jrv-impact_jrv_uploads:/data -v $(pwd):/backup alpine \
  tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
```

To restore a database dump:
```bash
cat backup-2026-06-21.sql | docker compose exec -T db psql -U jrv_user jrv_impact
```

## 8. Updating the app later

```bash
git pull   # or re-upload changed files
docker compose up -d --build
```
Your data is untouched — `init.sql` only runs on a brand-new (empty) database
volume, so schema changes after day one need a manual migration (a plain SQL
`ALTER TABLE` against the running `db` container is usually simplest for a
project this size).

---

## Design notes / assumptions baked into this build

- **Database schema**: lives in `backend/Data/schema.sql` and is applied
  automatically by the backend itself the first time it connects to an empty
  database (checked via `to_regclass('public.users')`). This works the same
  way whether you're on a self-hosted VPS or a managed Postgres instance
  (Railway, Render, etc.) that doesn't support the
  `docker-entrypoint-initdb.d` mount trick.
- **Code generation**: Pre Job Sheet codes are
  `{Location.ShortCode}-{Company.ShortCode}-{firstItem.JobTitle.ShortCode}-{firstItem.JobTitle.TypeTag}`
  (e.g. `MB-HT-FSI-PRD`), uppercased, with a numeric suffix on collision. The
  Job Sheet generated from it carries the same code. Adjust the rule in
  `backend/Services/CodeGeneratorService.cs` if your real-world convention differs.
- **GST**: fixed at 18%, applied automatically whenever Payment Mode isn't Cash.
- **Edit tracking**: when a Job Sheet is generated, its starting values are
  snapshotted (`original_*` columns). Every save afterwards compares current
  values against that snapshot (not the last save) to decide what's
  highlighted red — matching the mockup's behaviour.
- **Photos**: stored on the VPS disk under the `jrv_uploads` volume, served by
  the API at `/uploads/...`. Each Job Sheet line item requires one before it
  can be submitted.
- **WhatsApp share**: captures a share-card image client-side
  (`html2canvas`), then uses the Web Share API on supported mobile browsers to
  open the native share sheet with the image pre-attached (pick WhatsApp
  there). On desktop or unsupported browsers, it downloads the image and
  opens a `wa.me` chat for you to attach it manually — there's no paid
  WhatsApp Business API involved.
- **Roles**: single role for now — every logged-in user can access every
  module. Add role checks in the controllers + frontend nav if you need
  admin-vs-field permissions later.

## Deploying somewhere other than a VPS

Want a live URL on Railway or Render instead of (or before) setting up a VPS?
See **[DEPLOY_CLOUD.md](./DEPLOY_CLOUD.md)** — same codebase, no changes needed,
just a different set of dashboard clicks.

## Project structure

```
jrv-impact/
├── docker-compose.yml
├── .env.example
├── DEPLOY_CLOUD.md          ← Railway / Render walkthrough
├── backend/                 ← .NET 8 Web API
│   ├── Data/schema.sql      ← schema, source of truth (self-bootstrapped on startup)
│   ├── Models/ Dtos/ Services/ Controllers/
│   └── Dockerfile
└── frontend/                ← React + Vite
    ├── src/{api,context,components,pages,utils}/
    ├── nginx.conf
    └── Dockerfile
```
