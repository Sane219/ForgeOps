<p align="center">
  <img src="https://img.shields.io/badge/status-early_MVP-yellow" alt="Status">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/typescript-5.x-3178c6" alt="TypeScript">
  <img src="https://img.shields.io/badge/node-%3E%3D20.10-339933" alt="Node.js">
  <img src="https://img.shields.io/badge/pnpm-10.x-f69220" alt="pnpm">
</p>

<h1 align="center">ForgeOps</h1>

<p align="center">
  <strong>The internal developer platform with an AI copilot built in.</strong>
</p>

<p align="center">
  A self-service platform-engineering portal where teams scaffold services from curated templates,<br>
  generate production-ready deployment artifacts, run DevSecOps checks, and monitor rollouts.
</p>

---

ForgeOps is an **open-source Internal Developer Platform (IDP)** designed to give engineering teams a single pane of glass for the full service lifecycle — from scaffolding to production rollout.

Teams pick from curated templates (Next.js, NestJS, FastAPI, Go, Python worker), and ForgeOps generates everything needed to ship: **Dockerfiles, Kubernetes manifests, Helm values, CI pipelines, and ArgoCD applications**. A built-in AI copilot (gated behind a feature flag, always optional) analyzes failed rollouts and recommends optimizations.

Every external integration — Kubernetes rollouts, security scanners, metrics, logs, artifact publishing, and AI — lives behind a **provider interface**. The MVP ships with deterministic mocks; swapping in real adapters (Trivy, Prometheus, Loki, etc.) is a config change, not a refactor.

---

## Features

- **Service Catalog** — Register, version, and tag services across runtimes (Node.js, Python, Go)
- **Template-Based Scaffolding** — 5 production-ready templates with sensible defaults
- **Artifact Generation** — Dockerfile, K8s manifests, Helm values, CI pipeline, ArgoCD app from a single service config
- **Deployment & Rollout Management** — Trigger rollouts, observe progress, rollback on failure
- **DevSecOps** — Security scanning with findings, severity, and remediation guidance
- **Cost Estimation** — Per-rollout cost breakdown with savings suggestions
- **Observability** — CPU, memory, RPS, P95 latency, error rate metrics + incident tracking
- **Audit Trail** — Cross-cutting audit events for every mutation, scoped to workspace
- **AI Copilot** — Root cause analysis and recommendations (feature-flagged, always optional)
- **Multi-Workspace** — Workspace isolation with ADMIN / DEVELOPER / VIEWER RBAC
- **Platform-Managed Environments** — DEV, STAGING, PROD auto-seeded per workspace

---

## Quick start

```bash
# 1. Clone and install
git clone https://github.com/your-org/forgeops.git
cd forgeops
pnpm install

# 2. Configure environment
cp .env.example .env

# 3. Start infrastructure
pnpm docker:up        # Postgres 16 + Redis 7 + Mailhog

# 4. Run migrations and seed demo data
pnpm db:migrate
pnpm db:seed

# 5. Start development servers
pnpm dev
```

| Service | URL |
|---|---|
| **Web app** | http://localhost:3000 |
| **API server** | http://localhost:4000 |
| **Swagger docs** | http://localhost:4000/api/docs |
| **Mailhog UI** | http://localhost:8025 |

### Demo credentials

| Email | Password | Role |
|---|---|---|
| `admin@forgeops.dev` | `password123` | ADMIN |
| `dev@forgeops.dev` | `password123` | DEVELOPER |

---

## Architecture

ForgeOps is a **pnpm monorepo** with **Turborepo** task orchestration:

```
forgeops/
├── apps/
│   ├── api/           NestJS 10 backend (REST, Swagger, Prisma)
│   └── web/           Next.js 15 frontend (App Router, Tailwind v4, shadcn/ui)
├── packages/
│   ├── types/         Shared Zod schemas (single source of truth)
│   ├── ui/            Shared shadcn/ui components
│   ├── templates/     Handlebars artifact templates
│   ├── config-typescript/
│   └── config-eslint/
└── infra/
    ├── docker-compose.yml
    └── docker/        Multi-stage Dockerfiles
```

### Ports & Adapters

Every external integration follows the same pattern:

```
providers/<name>/
├── <name>.interface.ts    # Interface + Symbol token
├── mock-<name>.ts         # Deterministic mock
├── <name>.module.ts       # Factory (reads config)
└── [real-<name>.ts]       # Production adapter (future)
```

| Provider | Mock | Future real |
|---|---|---|
| Rollout | `MockRolloutDriver` | `KubernetesRolloutDriver` |
| Security | `MockSecurityScanner` | Trivy / Snyk |
| Metrics | `MockMetricsProvider` | Prometheus |
| Logs | `MockLogsProvider` | Loki |
| Artifact | `DbArtifactPublisher` | `GitArtifactPublisher` |
| AI | `DeterministicAiProvider` | `ClaudeAiProvider` |

---

## What's real vs. mocked

| Concern | MVP behavior | Future |
|---|---|---|
| **Artifact generation** | Real YAML from Handlebars templates | Same |
| **Cost estimation** | Real math against configurable pricing | + cloud billing APIs |
| **Auth + RBAC** | Real JWT cookies + bcrypt + role guards | + SSO / SAML |
| **Audit trail** | Real cross-cutting interceptor | Same |
| **Rollout execution** | Mock (BullMQ worker simulates phases) | Kubernetes driver |
| **Security scans** | Mock rule-based scanner | Trivy / Snyk |
| **Metrics / logs** | Synthesized time series | Prometheus + Loki |
| **AI copilot** | Deterministic analyzer (always) or Claude (when flag on) | Same |

---

## Documentation

| Document | Description |
|---|---|
| [Architecture](docs/architecture.md) | System design, component diagrams, data flow, ER diagram |
| [API Reference](docs/api-reference.md) | Complete REST endpoint documentation with request/response examples |
| [Contributing](CONTRIBUTING.md) | Local dev setup, workflow, code style, adding modules/providers |
| [Code of Conduct](CODE_OF_CONDUCT.md) | Contributor Covenant v2.0 |

---

## Tech stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js 20+ |
| **Language** | TypeScript 5.x (strict) |
| **Package manager** | pnpm 10 + Turborepo 2 |
| **Backend** | NestJS 10, Prisma 5, PostgreSQL 16, Redis 7, BullMQ |
| **Frontend** | Next.js 15 (App Router), Tailwind v4, shadcn/ui, TanStack Query |
| **Auth** | JWT (access+refresh) in httpOnly cookies, bcrypt |
| **Validation** | Zod + class-validator |
| **AI** | Anthropic Claude via Vercel AI SDK (optional) |
| **Logging** | Pino |
| **Containerization** | Docker (multi-stage, node:22-bookworm-slim) |

---

## Build roadmap

| Day | Focus | Status |
|---|---|---|
| 1 | Foundations (monorepo, configs, docker-compose) | Done |
| 2 | DB + Auth (Prisma migrations, AuthModule, RBAC) | Done |
| 3 | Services + Templates + Generator | Done |
| 4 | Deployments + Rollouts + Queues | Next |
| 5 | Security + Cost + Metrics/Incidents backend | |
| 6 | Frontend foundation (shell, auth, dashboard) | |
| 7 | Catalog + create-service wizard | |
| 8 | Deployments / Security / Metrics / Cost UI | |
| 9 | Logs + AI copilot + Audit + Settings | |
| 10 | Polish, seed, README, CI, demo deploy | |

---

## License

[MIT](LICENSE)
