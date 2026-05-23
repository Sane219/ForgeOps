# Contributing to ForgeOps

Thank you for your interest in contributing! This guide will help you get set up for local development.

## Prerequisites

| Tool | Minimum version | Install |
|---|---|---|
| Node.js | 20.10+ | [nodejs.org](https://nodejs.org/) or `nvm install 20` |
| pnpm | 9.0+ | `corepack enable` (ships with Node 20+) |
| Docker | 24+ | [docker.com](https://docs.docker.com/get-docker/) |
| Git | 2.30+ | [git-scm.com](https://git-scm.com/) |

## Getting started

```bash
# 1. Clone the repository
git clone https://github.com/your-org/forgeops.git
cd forgeops

# 2. Install dependencies
pnpm install

# 3. Copy the environment template
cp .env.example .env

# 4. Start infrastructure (Postgres, Redis, Mailhog)
pnpm docker:up

# 5. Run database migrations and seed demo data
pnpm db:migrate
pnpm db:seed

# 6. Start all apps in dev mode
pnpm dev
```

After `pnpm dev` you will have:

| Service | URL |
|---|---|
| Web app | http://localhost:3000 |
| API server | http://localhost:4000 |
| Swagger docs | http://localhost:4000/api/docs |
| Mailhog UI | http://localhost:8025 |

### Demo credentials

| Email | Password | Role |
|---|---|---|
| admin@forgeops.dev | password123 | ADMIN |
| dev@forgeops.dev | password123 | DEVELOPER |

## Monorepo structure

This project uses **pnpm workspaces** with **Turborepo** for task orchestration.

```
forgeops/
├── apps/
│   ├── api/        NestJS backend (REST API)
│   └── web/        Next.js frontend (App Router)
├── packages/
│   ├── types/      Shared Zod schemas + TypeScript types
│   ├── ui/         Shared shadcn/ui components
│   ├── templates/  Handlebars artifact templates
│   ├── config-typescript/
│   └── config-eslint/
└── infra/          Docker Compose + Dockerfiles
```

### Key commands

```bash
# Build all packages (respects dependency order)
pnpm build

# Typecheck everything
pnpm typecheck

# Lint everything
pnpm lint
pnpm lint:fix    # auto-fix

# Format with Prettier
pnpm format

# Run tests
pnpm test

# Database commands
pnpm db:migrate     # run Prisma migrations
pnpm db:seed        # seed demo data
pnpm db:studio      # open Prisma Studio GUI
pnpm db:generate    # regenerate Prisma Client

# Docker
pnpm docker:up      # start Postgres, Redis, Mailhog
pnpm docker:down    # stop containers
pnpm docker:logs    # tail container logs
```

## Development workflow

### Branch naming

- `feat/short-description` for new features
- `fix/short-description` for bug fixes
- `docs/short-description` for documentation changes
- `refactor/short-description` for code refactoring

### Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add service catalog filtering by runtime
fix: resolve workspace guard crash on missing slug
docs: update API reference with new endpoints
refactor: extract audit logic into dedicated service
```

### Pull requests

1. Create a feature branch from `main`
2. Make your changes
3. Ensure `pnpm typecheck` and `pnpm lint` pass
4. Open a PR against `main`
5. Include a clear description of what changed and why

## Adding a new API module

1. Create a new directory under `apps/api/src/modules/<name>/`
2. Create `<name>.module.ts`, `<name>.service.ts`, `<name>.controller.ts`
3. Register the module in `apps/api/src/app.module.ts`
4. Add Zod schemas to `packages/types/src/` if needed
5. Run `pnpm db:migrate` if you modified `prisma/schema.prisma`

## Adding a new provider

Providers are pluggable adapters for external integrations. See `apps/api/src/providers/` for examples.

1. Create `providers/<name>/<name>.interface.ts` with a Symbol injection token
2. Create `providers/<name>/mock-<name>.ts` with a mock implementation
3. Create `providers/<name>/<name>.module.ts` with a factory that reads config
4. Register the module in `app.module.ts`

## Environment variables

All environment variables are documented in [`.env.example`](.env.example). Copy it to `.env` and fill in values for your local setup.

Key variables:

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://forgeops:forgeops_dev_pw@localhost:5432/forgeops` |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens (min 32 chars) | Required |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens (min 32 chars) | Required |
| `FEATURE_AI_COPILOT_ENABLED` | Enable AI copilot features | `false` |
| `PROVIDER_ROLLOUT` | Rollout driver (`mock` or `kubernetes`) | `mock` |

## Code style

- **TypeScript strict mode** everywhere
- **Prettier** for formatting (config in root `.prettierrc`)
- **ESLint** for linting (shared config in `packages/config-eslint`)
- **No `any` types** — use `unknown` or proper typing
- Prefer functional patterns in frontend, class-based DI in NestJS backend

## Questions?

Open an issue or start a discussion on GitHub.
