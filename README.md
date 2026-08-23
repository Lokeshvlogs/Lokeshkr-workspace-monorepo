# lokesh-workspace

Nx and pnpm monorepo for Next.js apps, shared frontend packages, and Django services.

## Layout

- `apps/vivaah4you-web` - migrated Vivaah4You Next.js app.
- `packages/ui` - reusable React/Tailwind UI package extracted from `components/common`.
- `services/vivaah4u-api` - Django backend for Vivaah4You.

## Common Commands

Use Corepack to run pnpm in this environment:

```powershell
corepack pnpm install
corepack pnpm nx type-check ui
corepack pnpm nx type-check vivaah4you-web
corepack pnpm nx build vivaah4you-web
corepack pnpm nx check vivaah4u-api
corepack pnpm nx run vivaah4u-api:migrate
corepack pnpm nx serve vivaah4u-api
```

The shared UI package is consumed as `@lokesh-workspace/ui`.

## Django Service

Set up the backend from `services/vivaah4u-api`:

```powershell
cd services/vivaah4u-api
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
cd ..\..
corepack pnpm nx run vivaah4u-api:migrate
corepack pnpm nx serve vivaah4u-api
```

Or use the root service helper:

```powershell
.\service.bat vivaah4u-api server
.\service.bat vivaah4u-api migrate
.\service.bat vivaah4u-api makemigrations
.\service.bat vivaah4u-api test
.\service.bat vivaah4u-api check
```

The backend runs on `http://127.0.0.1:8001`. The Next.js app expects:

```powershell
DJANGO_BASE_URL=http://127.0.0.1:8001
```
