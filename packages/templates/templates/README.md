# Template bodies

This directory will contain the Handlebars source files for each template registered in `src/registry.ts`. Layout per template:

```
templates/<key>/
├── Dockerfile.hbs
├── k8s/
│   ├── deployment.yaml.hbs
│   ├── service.yaml.hbs
│   ├── ingress.yaml.hbs
│   └── hpa.yaml.hbs
├── helm/
│   └── values.yaml.hbs
├── ci/
│   └── github-actions.yml.hbs
└── argo/
    └── application.yaml.hbs
```

Templates land **Day 3** as part of the `GeneratorModule` implementation. Available Handlebars context:

- `service` — `{ name, slug, runtime, port, healthcheckPath, replicas, cpuMillicores, memoryMb, envVars[] }`
- `version` — `{ version, image }`
- `workspace` — `{ slug, name }`
- `environment` — `{ kind, name, region }`

Custom helpers will include `kebab`, `lower`, `quote`, `cpuToFraction`, `memoryToMi`, `jsonEnv`, etc.
