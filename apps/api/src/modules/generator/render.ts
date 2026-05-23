/**
 * Standalone artifact renderer — no NestJS DI required.
 * Used by GeneratorService (via DI) and seed.ts (direct import).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import Handlebars from 'handlebars';
import { registerHelpers } from '@forgeops/templates';
import type { ArtifactKind } from '@prisma/client';

const FORGEOPS_VERSION = '0.1.0';

export interface RenderContext {
  service: {
    name: string;
    slug: string;
    runtime: string;
    port: number;
    healthcheckPath: string;
    replicas: number;
    cpuMillicores: number;
    memoryMb: number;
    envVars: Array<{ key: string; value: string; secret: boolean }>;
  };
  version: {
    version: number;
    image: string;
  };
  workspace: {
    slug: string;
    name: string;
  };
  metadata: {
    generatedAt: string;
    generatorVersion: string;
    forgeopsVersion: string;
  };
}

export interface RenderedArtifact {
  kind: ArtifactKind;
  filename: string;
  content: string;
  contentType: string;
  checksum: string;
}

const TEMPLATE_ROOT = path.resolve(__dirname, '../../../../../packages/templates/templates');

// Lazily-initialized Handlebars instance
let _hbs: typeof Handlebars | null = null;

function getHbs(): typeof Handlebars {
  if (!_hbs) {
    _hbs = Handlebars.create();
    registerHelpers(_hbs);
  }
  return _hbs;
}

/**
 * Load and compile a .hbs template from the templates directory.
 * Results are cached by the Handlebars runtime.
 */
function loadTemplate(templateDir: string, relativePath: string): HandlebarsTemplateDelegate {
  const hbs = getHbs();
  const fullPath = path.join(TEMPLATE_ROOT, templateDir, relativePath);
  const source = fs.readFileSync(fullPath, 'utf-8');
  return hbs.compile(source);
}

function sha256(content: string): string {
  return `sha256:${crypto.createHash('sha256').update(content).digest('hex')}`;
}

/**
 * Build the render context from service/version/workspace data.
 */
export function buildRenderContext(params: {
  service: { name: string; slug: string; runtime: string; port: number; healthcheckPath: string; replicas: number; cpuMillicores: number; memoryMb: number; envVars: unknown };
  version: { version: number; image: string | null };
  workspace: { slug: string; name: string };
}): RenderContext {
  return {
    service: {
      name: params.service.name,
      slug: params.service.slug,
      runtime: params.service.runtime,
      port: params.service.port,
      healthcheckPath: params.service.healthcheckPath,
      replicas: params.service.replicas,
      cpuMillicores: params.service.cpuMillicores,
      memoryMb: params.service.memoryMb,
      envVars: Array.isArray(params.service.envVars)
        ? (params.service.envVars as Array<{ key: string; value: string; secret: boolean }>)
        : [],
    },
    version: {
      version: params.version.version,
      image: params.version.image ?? `ghcr.io/${params.service.slug}:v${params.version.version}`,
    },
    workspace: params.workspace,
    metadata: {
      generatedAt: new Date().toISOString(),
      generatorVersion: FORGEOPS_VERSION,
      forgeopsVersion: FORGEOPS_VERSION,
    },
  };
}

/**
 * Render all 5 artifact kinds for a given template and context.
 * Returns a map of ArtifactKind → RenderedArtifact.
 */
export function renderArtifacts(templateDir: string, ctx: RenderContext): Map<ArtifactKind, RenderedArtifact> {
  const artifacts = new Map<ArtifactKind, RenderedArtifact>();

  // Dockerfile
  try {
    const tpl = loadTemplate(templateDir, 'Dockerfile.hbs');
    const content = tpl(ctx);
    artifacts.set('DOCKERFILE', {
      kind: 'DOCKERFILE',
      filename: 'Dockerfile',
      content,
      contentType: 'text/plain',
      checksum: sha256(content),
    });
  } catch (err) {
    // Template may not have a Dockerfile — skip
  }

  // K8S_MANIFEST — concatenate deployment + service YAML
  try {
    const deployTpl = loadTemplate(templateDir, 'k8s/deployment.yaml.hbs');
    let serviceYaml = '';
    try {
      const svcTpl = loadTemplate(templateDir, 'k8s/service.yaml.hbs');
      serviceYaml = '\n---\n' + svcTpl(ctx);
    } catch {
      // Service YAML is optional
    }
    const content = deployTpl(ctx) + serviceYaml;
    artifacts.set('K8S_MANIFEST', {
      kind: 'K8S_MANIFEST',
      filename: 'k8s.yaml',
      content,
      contentType: 'text/yaml',
      checksum: sha256(content),
    });
  } catch (err) {
    // Template may not have K8s manifests
  }

  // HELM_VALUES
  try {
    const tpl = loadTemplate(templateDir, 'helm/values.yaml.hbs');
    const content = tpl(ctx);
    artifacts.set('HELM_VALUES', {
      kind: 'HELM_VALUES',
      filename: 'values.yaml',
      content,
      contentType: 'text/yaml',
      checksum: sha256(content),
    });
  } catch (err) {
    // Template may not have Helm values
  }

  // CI_PIPELINE
  try {
    const tpl = loadTemplate(templateDir, 'ci/github-actions.yml.hbs');
    const content = tpl(ctx);
    artifacts.set('CI_PIPELINE', {
      kind: 'CI_PIPELINE',
      filename: 'ci.yml',
      content,
      contentType: 'text/yaml',
      checksum: sha256(content),
    });
  } catch (err) {
    // Template may not have CI pipeline
  }

  // ARGO_APP
  try {
    const tpl = loadTemplate(templateDir, 'argo/application.yaml.hbs');
    const content = tpl(ctx);
    artifacts.set('ARGO_APP', {
      kind: 'ARGO_APP',
      filename: 'application.yaml',
      content,
      contentType: 'text/yaml',
      checksum: sha256(content),
    });
  } catch (err) {
    // Template may not have ArgoCD app
  }

  return artifacts;
}
