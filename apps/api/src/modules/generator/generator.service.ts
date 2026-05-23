import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildRenderContext, renderArtifacts } from './render';
import type { ArtifactKind } from '@prisma/client';

@Injectable()
export class GeneratorService {
  private readonly logger = new Logger(GeneratorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate all artifacts for the latest version of a service.
   * Upserts into the Artifact table. Returns the generated bundle.
   */
  async generateForService(workspaceId: string, serviceId: string) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, workspaceId },
      include: {
        workspace: { select: { id: true, slug: true, name: true } },
        versions: { orderBy: { version: 'desc' }, take: 1 },
      },
    });
    if (!service) throw new NotFoundException('Service not found');
    if (!service.versions[0]) throw new NotFoundException('Service has no versions');

    const version = service.versions[0];

    // Resolve template directory from runtime
    const templateDir = this.resolveTemplateDir(service.runtime);

    const ctx = buildRenderContext({
      service: {
        name: service.name,
        slug: service.slug,
        runtime: service.runtime,
        port: version.port,
        healthcheckPath: version.healthcheckPath,
        replicas: version.replicas,
        cpuMillicores: version.cpuMillicores,
        memoryMb: version.memoryMb,
        envVars: (version.envVars as Array<{ key: string; value: string; secret: boolean }>) ?? [],
      },
      version: {
        version: version.version,
        image: version.image,
      },
      workspace: service.workspace,
    });

    const rendered = renderArtifacts(templateDir, ctx);
    this.logger.log(`Rendered ${rendered.size} artifacts for ${service.slug} v${version.version}`);

    // Upsert each artifact
    const saved: Array<{ kind: ArtifactKind; filename: string; checksum: string }> = [];
    for (const [kind, artifact] of rendered) {
      await this.prisma.artifact.upsert({
        where: {
          serviceVersionId_kind_filename: {
            serviceVersionId: version.id,
            kind,
            filename: artifact.filename,
          },
        },
        create: {
          serviceVersionId: version.id,
          kind,
          filename: artifact.filename,
          content: artifact.content,
          contentType: artifact.contentType,
          checksum: artifact.checksum,
          generatorVersion: '0.1.0',
        },
        update: {
          content: artifact.content,
          contentType: artifact.contentType,
          checksum: artifact.checksum,
          generatorVersion: '0.1.0',
        },
      });
      saved.push({ kind, filename: artifact.filename, checksum: artifact.checksum });
    }

    return {
      serviceVersionId: version.id,
      version: version.version,
      image: version.image,
      artifacts: saved,
    };
  }

  private resolveTemplateDir(runtime: string): string {
    const map: Record<string, string> = {
      NEXTJS: 'nextjs-app',
      NESTJS: 'nestjs-api',
      FASTAPI: 'fastapi-service',
      PYTHON_WORKER: 'python-worker',
      GO_SERVICE: 'go-service',
    };
    return map[runtime] ?? 'nestjs-api';
  }
}
