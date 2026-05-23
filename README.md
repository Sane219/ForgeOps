# ForgeOps

> The internal developer platform with an AI copilot built in.

ForgeOps is a self-service platform-engineering portal where engineering teams scaffold services from curated templates, generate production-ready deployment artifacts (Dockerfile, Kubernetes manifests, Helm values, CI pipelines, ArgoCD applications), run DevSecOps checks, and monitor rollouts — with an AI copilot that explains failures and recommends optimizations.

## Status

🚧 **Early MVP** — Day-1 scaffold complete. See the roadmap in this README for the day-by-day build plan.

## Architecture

- **Monorepo** — pnpm workspaces + Turborepo
- **Backend** — NestJS + Prisma + PostgreSQL 16 + Redis 7 + BullMQ
- **Frontend** — Next.js 15 (App Router) + Tailwind v4 + shadcn/ui + TanStack Query
- **Shared types** — Zod schemas in `packages/types` are the single source of truth for both ends
- **Mocks behind interfaces** — every external integration (Kubernetes rollouts, security scanners, metrics, logs, artifact publishing, AI) sits behind a provider interface in `apps/api/src/providers/`. Switch from mock to real with config, not a refactor.
- **AI is optional** — gated by `FEATURE_AI_COPILOT_ENABLED`. The product demos end-to-end with no API key thanks to a deterministic analyzer that is always available.

## Getting started

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env file
cp .env.example .env

# 3. Start Postgres + Redis + Mailhog
pnpm docker:up

# 4. Run database migrations + seed (lands Day 2)
pnpm db:migrate
pnpm db:seed

# 5. Start everything
pnpm dev
# → web:          http://localhost:3000
# → api:          http://localhost:4000
# → api docs:     http://localhost:4000/api/docs
# → bull-board:   http://localhost:4000/queues  (dev only)
# → mailhog ui:   http://localhost:8025
```

## Project layout

```
forgeops/
├── apps/
│   ├── web/                Next.js 15 frontend
│   └── api/                NestJS backend
│       └── src/providers/  ← Pluggable adapters (rollout, security, metrics, logs, artifact-publisher, ai)
├── packages/
│   ├── types/              Shared Zod schemas + inferred TS types
│   ├── ui/                 Shared shadcn-based components
│   ├── templates/          Handlebars templates for generated artifacts
│   ├── config-typescript/  Shared tsconfig presets
│   └── config-eslint/      Shared ESLint flat-config presets
└── infra/
    ├── docker-compose.yml  Postgres + Redis + Mailhog
    └── docker/             App Dockerfiles
```

## What's real vs. mocked

| Concern              | MVP behavior                                                                          | Future real impl              |
|----------------------|---------------------------------------------------------------------------------------|-------------------------------|
| Artifact generation  | **Real.** Valid Dockerfile / K8s / Helm / CI / Argo YAML from Handlebars templates    | Same                          |
| Cost estimation      | **Real.** Math against a configurable pricing table                                   | + cloud billing APIs          |
| Auth + RBAC          | **Real.** JWT (access+refresh) in httpOnly cookies, bcrypt                            | + SSO / SAML                  |
| Audit trail          | **Real.** Cross-cutting via interceptor                                               | Same                          |
| Rollout execution    | Mock (BullMQ worker simulates phases + occasional K8s-style failures)                 | `KubernetesRolloutDriver`     |
| Security scans       | Mock rule-based scanner; deterministic findings from service + template config        | Trivy / Snyk                  |
| Metrics / logs       | Synthesized time series + log lines with diurnal patterns and incident-correlated spikes | Prometheus + Loki          |
| AI copilot           | Deterministic analyzer (always) or Claude (when flag + key set)                       | Same                          |

## Build roadmap (10 days)

| Day | Focus                                          | Status |
|-----|------------------------------------------------|--------|
| 1   | Foundations (monorepo, configs, docker-compose) | 🚧 in progress |
| 2   | DB + Auth (Prisma migrations, AuthModule, RBAC) | ⏭ next |
| 3   | Services + Templates + Generator               | ⏭ |
| 4   | Deployments + Rollouts + Queues                | ⏭ |
| 5   | Security + Cost + Metrics/Incidents backend    | ⏭ |
| 6   | Frontend foundation (shell, auth, dashboard)   | ⏭ |
| 7   | Catalog + create-service wizard                | ⏭ |
| 8   | Deployments / Security / Metrics / Cost UI     | ⏭ |
| 9   | Logs + AI copilot + Audit + Settings           | ⏭ |
| 10  | Polish, seed, README, CI, demo deploy          | ⏭ |

## v2 ideas (out of MVP scope)

- Real Kubernetes integration via `KubernetesRolloutDriver`
- Real Argo CD sync via `GitArtifactPublisher`
- Trivy + Snyk integration
- Kafka event bus for cross-service notifications
- SSO/SAML, Slack/email notifications, billing/usage metering

## License

MIT
