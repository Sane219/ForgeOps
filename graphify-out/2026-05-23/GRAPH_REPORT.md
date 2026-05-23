# Graph Report - .  (2026-05-23)

## Corpus Check
- Corpus is ~8,613 words - fits in a single context window. You may not need a graph.

## Summary
- 753 nodes · 822 edges · 64 communities (50 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_API Application Core|API Application Core]]
- [[_COMMUNITY_API Dev Dependencies|API Dev Dependencies]]
- [[_COMMUNITY_Web App Dependencies|Web App Dependencies]]
- [[_COMMUNITY_Root Workspace Config|Root Workspace Config]]
- [[_COMMUNITY_API Runtime Dependencies|API Runtime Dependencies]]
- [[_COMMUNITY_UI Package|UI Package]]
- [[_COMMUNITY_Infrastructure & Docs|Infrastructure & Docs]]
- [[_COMMUNITY_Turbo Build Pipeline|Turbo Build Pipeline]]
- [[_COMMUNITY_Web Dev Dependencies|Web Dev Dependencies]]
- [[_COMMUNITY_AI Provider Interface|AI Provider Interface]]
- [[_COMMUNITY_Root TSConfig|Root TSConfig]]
- [[_COMMUNITY_Config TypeScript Base|Config TypeScript Base]]
- [[_COMMUNITY_Types Package|Types Package]]
- [[_COMMUNITY_Templates Package|Templates Package]]
- [[_COMMUNITY_Auth & Health Controllers|Auth & Health Controllers]]
- [[_COMMUNITY_Shadcn Components Config|Shadcn Components Config]]
- [[_COMMUNITY_Shared Zod Schemas|Shared Zod Schemas]]
- [[_COMMUNITY_ESLint Config Package|ESLint Config Package]]
- [[_COMMUNITY_Logs Provider|Logs Provider]]
- [[_COMMUNITY_Rollout Provider|Rollout Provider]]
- [[_COMMUNITY_API TSConfig|API TSConfig]]
- [[_COMMUNITY_Metrics Provider|Metrics Provider]]
- [[_COMMUNITY_Security Scanner Provider|Security Scanner Provider]]
- [[_COMMUNITY_Node TSConfig|Node TSConfig]]
- [[_COMMUNITY_Next.js TSConfig|Next.js TSConfig]]
- [[_COMMUNITY_AI Types|AI Types]]
- [[_COMMUNITY_Observability Types|Observability Types]]
- [[_COMMUNITY_Artifact Publisher Provider|Artifact Publisher Provider]]
- [[_COMMUNITY_Deployment Types|Deployment Types]]
- [[_COMMUNITY_Audit & Feature Flag Types|Audit & Feature Flag Types]]
- [[_COMMUNITY_Security Types|Security Types]]
- [[_COMMUNITY_Web TSConfig|Web TSConfig]]
- [[_COMMUNITY_Auth Types|Auth Types]]
- [[_COMMUNITY_Workspace Types|Workspace Types]]
- [[_COMMUNITY_Request Context & Decorators|Request Context & Decorators]]
- [[_COMMUNITY_UI TSConfig|UI TSConfig]]
- [[_COMMUNITY_NestJS CLI Config|NestJS CLI Config]]
- [[_COMMUNITY_Cost Types|Cost Types]]
- [[_COMMUNITY_RBAC Guard|RBAC Guard]]
- [[_COMMUNITY_Audit Interceptor|Audit Interceptor]]
- [[_COMMUNITY_Template Registry|Template Registry]]
- [[_COMMUNITY_Artifact Types|Artifact Types]]
- [[_COMMUNITY_Templates TSConfig|Templates TSConfig]]
- [[_COMMUNITY_Types TSConfig|Types TSConfig]]
- [[_COMMUNITY_Package Defaults|Package Defaults]]
- [[_COMMUNITY_Web Root Layout|Web Root Layout]]
- [[_COMMUNITY_Zod Validation Pipe|Zod Validation Pipe]]
- [[_COMMUNITY_Build TSConfig|Build TSConfig]]
- [[_COMMUNITY_Database Seed|Database Seed]]
- [[_COMMUNITY_Workspace Guard|Workspace Guard]]
- [[_COMMUNITY_Claude Hooks|Claude Hooks]]
- [[_COMMUNITY_OpenClaude Settings|OpenClaude Settings]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Cost Estimation Concept|Cost Estimation Concept]]
- [[_COMMUNITY_Auth & RBAC Concept|Auth & RBAC Concept]]
- [[_COMMUNITY_Audit Trail Concept|Audit Trail Concept]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 19 edges
2. `compilerOptions` - 19 edges
3. `scripts` - 17 edges
4. `scripts` - 15 edges
5. `compilerOptions` - 9 edges
6. `compilerOptions` - 9 edges
7. `tasks` - 8 edges
8. `ForgeOps` - 8 edges
9. `Provider Registry` - 8 edges
10. `scripts` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Graphify Knowledge Graph` --references--> `ForgeOps`  [EXTRACTED]
  CLAUDE.md → README.md
- `Backend Stack` --conceptually_related_to--> `Rollout Provider`  [INFERRED]
  README.md → apps/api/src/providers/README.md
- `Ports and Adapters Pattern` --conceptually_related_to--> `Provider Interfaces`  [INFERRED]
  apps/api/src/providers/README.md → README.md
- `AI Provider` --conceptually_related_to--> `AI Is Optional Pattern`  [INFERRED]
  apps/api/src/providers/README.md → README.md
- `Handlebars Templates` --conceptually_related_to--> `Artifact Generation`  [INFERRED]
  packages/templates/templates/README.md → README.md

## Hyperedges (group relationships)
- **Provider Adapter Pattern** — providers_ports_adapters, providers_rollout, providers_security, providers_metrics, providers_logs, providers_artifact_publisher, providers_ai [EXTRACTED 1.00]
- **Infrastructure Services** — infra_docker_compose, infra_postgres, infra_redis, infra_mailhog, readme_backend_stack [EXTRACTED 1.00]
- **Template Generation Pipeline** — templates_handlebars, templates_context_schema, readme_template_generation, providers_artifact_publisher [INFERRED 0.85]

## Communities (64 total, 14 thin omitted)

### Community 0 - "API Application Core"
Cohesion: 0.06
Nodes (21): AiModule, AiProviderModule, AuditModule, AuthModule, Env, envSchema, validateEnv(), CostModule (+13 more)

### Community 1 - "API Dev Dependencies"
Cohesion: 0.05
Nodes (38): devDependencies, eslint, @forgeops/config-eslint, @forgeops/config-typescript, @nestjs/cli, @nestjs/schematics, @nestjs/testing, prisma (+30 more)

### Community 2 - "Web App Dependencies"
Cohesion: 0.06
Nodes (35): dependencies, class-variance-authority, clsx, cmdk, @forgeops/types, @forgeops/ui, @hookform/resolvers, lucide-react (+27 more)

### Community 3 - "Root Workspace Config"
Cohesion: 0.06
Nodes (31): description, devDependencies, prettier, prettier-plugin-tailwindcss, turbo, @types/node, typescript, engines (+23 more)

### Community 4 - "API Runtime Dependencies"
Cohesion: 0.07
Nodes (30): dependencies, bcrypt, bullmq, class-transformer, class-validator, cookie-parser, express, @forgeops/templates (+22 more)

### Community 5 - "UI Package"
Cohesion: 0.07
Nodes (27): default, dependencies, clsx, tailwind-merge, devDependencies, eslint, @forgeops/config-eslint, @forgeops/config-typescript (+19 more)

### Community 6 - "Infrastructure & Docs"
Cohesion: 0.10
Nodes (26): Graphify Knowledge Graph, Docker Compose Infrastructure, Mailhog, PostgreSQL 16, Redis 7, PNPM Workspace Config, AI Provider, Artifact Publisher Provider (+18 more)

### Community 7 - "Turbo Build Pipeline"
Cohesion: 0.08
Nodes (24): dependsOn, outputs, cache, cache, persistent, globalDependencies, globalEnv, dependsOn (+16 more)

### Community 8 - "Web Dev Dependencies"
Cohesion: 0.08
Nodes (23): devDependencies, eslint, eslint-config-next, @forgeops/config-eslint, @forgeops/config-typescript, postcss, tailwindcss, @tailwindcss/postcss (+15 more)

### Community 9 - "AI Provider Interface"
Cohesion: 0.15
Nodes (13): AI_PROVIDER, AiAnalysisResult, AiAnalyzeInput, AiChatMessage, AiProvider, AiRecommendation, AiRootCause, AiSubject (+5 more)

### Community 10 - "Root TSConfig"
Cohesion: 0.09
Nodes (21): compilerOptions, allowSyntheticDefaultImports, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, incremental, isolatedModules (+13 more)

### Community 11 - "Config TypeScript Base"
Cohesion: 0.10
Nodes (20): compilerOptions, allowSyntheticDefaultImports, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, incremental, isolatedModules (+12 more)

### Community 12 - "Types Package"
Cohesion: 0.10
Nodes (20): default, dependencies, zod, devDependencies, eslint, @forgeops/config-eslint, @forgeops/config-typescript, typescript (+12 more)

### Community 13 - "Templates Package"
Cohesion: 0.11
Nodes (19): default, dependencies, @forgeops/types, devDependencies, eslint, @forgeops/config-eslint, @forgeops/config-typescript, typescript (+11 more)

### Community 14 - "Auth & Health Controllers"
Cohesion: 0.13
Nodes (6): Public(), FeatureFlagsController, FeatureFlagsModule, JwtAuthGuard, HealthController, HealthModule

### Community 15 - "Shadcn Components Config"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 16 - "Shared Zod Schemas"
Cohesion: 0.13
Nodes (15): EnvVar, envVarSchema, idSchema, PageResult, Pagination, paginationSchema, slugSchema, CreateServiceInput (+7 more)

### Community 17 - "ESLint Config Package"
Cohesion: 0.12
Nodes (15): dependencies, eslint, eslint-config-prettier, @eslint/js, globals, typescript-eslint, exports, ./base (+7 more)

### Community 18 - "Logs Provider"
Cohesion: 0.23
Nodes (9): choice, LogsProviderModule, LogEntry, LogLevel, LogPage, LogQuery, LOGS_PROVIDER, LogsProvider (+1 more)

### Community 19 - "Rollout Provider"
Cohesion: 0.23
Nodes (7): MockRolloutDriver, ROLLOUT_DRIVER, RolloutDriver, RolloutObservation, RolloutPlan, choice, RolloutProviderModule

### Community 20 - "API TSConfig"
Cohesion: 0.17
Nodes (11): compilerOptions, baseUrl, incremental, outDir, paths, rootDir, skipLibCheck, exclude (+3 more)

### Community 21 - "Metrics Provider"
Cohesion: 0.26
Nodes (8): choice, MetricsProviderModule, METRICS_PROVIDER, MetricSamplePoint, MetricsProvider, MetricsRange, MetricsSeries, MockMetricsProvider

### Community 22 - "Security Scanner Provider"
Cohesion: 0.26
Nodes (8): MockSecurityScanner, choice, SecurityProviderModule, ScanInput, ScannerFinding, ScanResult, SECURITY_SCANNER, SecurityScanner

### Community 23 - "Node TSConfig"
Cohesion: 0.17
Nodes (11): compilerOptions, emitDecoratorMetadata, experimentalDecorators, lib, module, moduleResolution, target, types (+3 more)

### Community 24 - "Next.js TSConfig"
Cohesion: 0.17
Nodes (11): compilerOptions, allowJs, incremental, jsx, lib, module, moduleResolution, noEmit (+3 more)

### Community 25 - "AI Types"
Cohesion: 0.17
Nodes (11): AiAnalysisResult, AiAnalyzeRequest, aiAnalyzeSchema, AiChatMessage, aiChatMessageSchema, AiChatRequest, aiChatSchema, AiRecommendation (+3 more)

### Community 26 - "Observability Types"
Cohesion: 0.17
Nodes (11): IncidentStatus, IncidentSummary, LogEntrySummary, LogLevel, logLevelEnum, LogsQueryInput, logsQuerySchema, MetricSamplePoint (+3 more)

### Community 27 - "Artifact Publisher Provider"
Cohesion: 0.29
Nodes (7): ARTIFACT_PUBLISHER, ArtifactPublisher, PublishInput, PublishResult, ArtifactPublisherModule, choice, DbArtifactPublisher

### Community 28 - "Deployment Types"
Cohesion: 0.20
Nodes (9): DeploymentSummary, envKindEnum, RollbackInput, rollbackSchema, RolloutSummary, TriggerRolloutInput, triggerRolloutSchema, HealthStatus (+1 more)

### Community 30 - "Audit & Feature Flag Types"
Cohesion: 0.22
Nodes (6): AuditEventSummary, AuditQueryInput, auditQuerySchema, AuditAction, DEFAULT_FEATURE_FLAGS, FeatureFlags

### Community 31 - "Security Types"
Cohesion: 0.28
Nodes (7): FindingKind, Severity, findingKindEnum, SecurityFindingSummary, SecurityReportDetail, SecurityReportSummary, severityEnum

### Community 32 - "Web TSConfig"
Cohesion: 0.22
Nodes (8): compilerOptions, baseUrl, paths, plugins, exclude, extends, include, @/*

### Community 33 - "Auth Types"
Cohesion: 0.25
Nodes (7): LoginInput, loginSchema, SessionResponse, SessionUser, SignupInput, signupSchema, WorkspaceMembershipSummary

### Community 34 - "Workspace Types"
Cohesion: 0.25
Nodes (7): Role, CreateWorkspaceInput, createWorkspaceSchema, InviteMemberInput, inviteMemberSchema, UpdateMemberRoleInput, updateMemberRoleSchema

### Community 35 - "Request Context & Decorators"
Cohesion: 0.32
Nodes (5): CurrentUser, CurrentWorkspace, AuthenticatedUser, ForgeOpsRequest, WorkspaceContext

### Community 36 - "UI TSConfig"
Cohesion: 0.25
Nodes (7): compilerOptions, noEmit, outDir, rootDir, exclude, extends, include

### Community 37 - "NestJS CLI Config"
Cohesion: 0.29
Nodes (6): collection, compilerOptions, assets, deleteOutDir, $schema, sourceRoot

### Community 38 - "Cost Types"
Cohesion: 0.29
Nodes (6): CostBreakdown, CostInput, costInputSchema, CostSuggestion, CostWarning, EnvKind

### Community 41 - "Template Registry"
Cohesion: 0.33
Nodes (3): Runtime, TemplateDefinition, templateRegistry

### Community 42 - "Artifact Types"
Cohesion: 0.33
Nodes (5): ArtifactBundle, ArtifactDetail, artifactKindEnum, ArtifactSummary, ArtifactKind

### Community 43 - "Templates TSConfig"
Cohesion: 0.33
Nodes (5): compilerOptions, noEmit, exclude, extends, include

### Community 44 - "Types TSConfig"
Cohesion: 0.33
Nodes (5): compilerOptions, noEmit, exclude, extends, include

### Community 45 - "Package Defaults"
Cohesion: 0.40
Nodes (4): files, name, private, version

## Knowledge Gaps
- **443 isolated node(s):** `$schema`, `target`, `module`, `moduleResolution`, `lib` (+438 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `API Runtime Dependencies` to `API Dev Dependencies`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `bootstrap()` connect `API Runtime Dependencies` to `API Application Core`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **What connects `$schema`, `target`, `module` to the rest of the system?**
  _449 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Application Core` be split into smaller, more focused modules?**
  _Cohesion score 0.06448202959830866 - nodes in this community are weakly interconnected._
- **Should `API Dev Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Web App Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Should `Root Workspace Config` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._