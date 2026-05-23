# Provider registry

This directory implements the **ports-and-adapters** seam between the ForgeOps domain layer and the outside world. Every external integration that has a "mock for MVP, real later" trajectory lives here.

## Pattern

Each pluggable surface owns a folder with:

```
providers/<surface>/
├── <surface>.interface.ts       The port. Always exports a Symbol token + an interface.
├── mock-<surface>.<kind>.ts     MVP default implementation. Always present.
├── real-<surface>.<kind>.stub.ts  (Optional) Placeholder marking the future real impl.
└── <surface>.module.ts          Nest module. Factory picks the impl from ConfigService.
```

Consumers inject the token, not a concrete class:

```ts
constructor(@Inject(ROLLOUT_DRIVER) private readonly driver: RolloutDriver) {}
```

Switching from mock to real is then a config change (`PROVIDER_ROLLOUT=kubernetes`), not a refactor.

## Surfaces

| Folder                | Token                 | Mock impl                       | Future real impl                              |
|-----------------------|-----------------------|---------------------------------|-----------------------------------------------|
| `rollout/`            | `ROLLOUT_DRIVER`      | `MockRolloutDriver` (BullMQ)    | `KubernetesRolloutDriver` (kubectl / Argo)    |
| `security/`           | `SECURITY_SCANNER`    | `MockSecurityScanner` (rules)   | `TrivyScanner`, `SnykScanner`                 |
| `metrics/`            | `METRICS_PROVIDER`    | `MockMetricsProvider`           | `PrometheusMetricsProvider`                   |
| `logs/`               | `LOGS_PROVIDER`       | `MockLogsProvider`              | `LokiLogsProvider`                            |
| `artifact-publisher/` | `ARTIFACT_PUBLISHER`  | `DbArtifactPublisher`           | `GitArtifactPublisher` (push to config repo)  |
| `ai/`                 | `AI_PROVIDER`         | `DeterministicAiProvider`       | `ClaudeAiProvider` (Anthropic SDK)            |

The AI provider is special-cased: the factory picks Claude only when **both** `FEATURE_AI_COPILOT_ENABLED=true` **and** `ANTHROPIC_API_KEY` is set; otherwise the deterministic provider is used so the product demos end-to-end with zero external credentials.
