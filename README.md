# NUMMF — National Unified Material Master Framework

AI-powered platform for harmonizing material master data across Central Public Sector Enterprises (CPSEs) under the vision of **One Nation – One Material Code**.

## Why This Exists

CPSEs in Oil & Gas, Power, Steel, Mining and Heavy Engineering maintain similar materials under different codes, descriptions and units. This causes duplicate masters, fragmented procurement data, excess inventory and missed aggregation opportunities.

NUMMF solves this with:

- **AI Material Matching** — NLP + TF-IDF + specification scoring detects identical, duplicate, near-duplicate and functionally equivalent materials.
- **Standard Material Master** — Auto-generated Common National Material Code with unified descriptions and taxonomy classification.
- **CPSE Code Mapping** — Every legacy CPSE code maps to its national standard while retaining traceability.
- **Approval Workflow** — Human-in-the-loop review and approval for all AI recommendations.
- **Dashboard & Analytics** — Real-time metrics on harmonization, duplication and mapping progress.
- **Audit Trail** — Immutable logs for every create, update, approve, reject and import action.
- **ERP Integration** — REST endpoints ready to push approved mappings to SAP/Oracle ERP systems.

## Tech Stack

- Next.js 16 App Router
- React 19 + TypeScript
- Tailwind CSS 4
- Drizzle ORM + PostgreSQL
- `natural` (NLP) + `fastest-levenshtein`

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Ensure PostgreSQL is running and DATABASE_URL is set in .env
# DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db

# 3. Push schema
npx drizzle-kit push

# 4. Seed demo data
curl -X POST http://localhost:3000/api/seed

# 5. Run dev server
npm run dev
```

## Deploying to Vercel

The build no longer fails if `DATABASE_URL` is missing during the Vercel build phase. However, you **must** add a real `DATABASE_URL` to Vercel so the app can connect at runtime.

### Step 1: Provision a PostgreSQL database

Use any managed PostgreSQL provider (e.g. Vercel Postgres, Neon, Supabase, AWS RDS) and copy the connection string.

### Step 2: Add environment variable in Vercel

1. Go to your project on Vercel → **Settings** → **Environment Variables**.
2. Add `DATABASE_URL` with your PostgreSQL connection string.
3. Make sure it is applied to **Production**, **Preview**, and **Development** environments.
4. Redeploy the project.

### Step 3: Run schema push & seed (one-time)

After the first deploy, push the schema and seed data using Vercel CLI or a local connection pointing to the same database:

```bash
# Using Vercel CLI
vercel env pull .env
npx drizzle-kit push
curl -X POST https://your-project.vercel.app/api/seed
```

> ⚠️ Do not commit `.env` to Git. Vercel injects environment variables at runtime.

## Project Structure

```
/app                 API routes and dashboard pages
/components          Reusable UI components
/db                  Drizzle schema and client
/lib/ai              AI matching and standardization engine
/lib/seed.ts         Demo data seeder
```

## API Routes

- `POST /api/seed` — Seed demo CPSEs, materials, standards and AI matches.
- `GET /api/dashboard` — Dashboard analytics.
- `GET /api/materials` — List legacy material masters.
- `GET /api/standard-materials` — List national standard materials.
- `POST /api/matching/run` — Run AI matcher.
- `GET|POST /api/matching/results` — Review/approve AI recommendations.
- `GET|PATCH /api/mappings` — Manage CPSE ↔ national mappings.
- `POST /api/upload` — Bulk import CSV.
- `POST /api/erp/sync` — Push mappings to ERP.
- `GET /api/audit` — Audit trail.

## License

Built for Smart India Hackathon 2026.
