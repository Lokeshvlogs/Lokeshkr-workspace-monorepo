# lokesh-workspace

Nx and pnpm monorepo for Next.js apps, shared frontend packages, and Django services.

## Layout

- `apps/vivaah4you-web` - migrated Vivaah4You Next.js app.
- `packages/ui` - reusable React/Tailwind UI package extracted from `components/common`.
- `services` - reserved for Django backends.

## Common Commands

Use Corepack to run pnpm in this environment:

```powershell
corepack pnpm install
corepack pnpm nx type-check ui
corepack pnpm nx type-check vivaah4you-web
corepack pnpm nx build vivaah4you-web
```

The shared UI package is consumed as `@lokesh-workspace/ui`.
