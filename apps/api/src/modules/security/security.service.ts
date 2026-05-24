import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SECURITY_SCANNER, type ScanInput, type SecurityScanner } from '../../providers/security/security-scanner.interface';

@Injectable()
export class SecurityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(SECURITY_SCANNER) private readonly scanner: SecurityScanner,
  ) {}

  async scan(rolloutId: string) {
    const rollout = await this.prisma.rollout.findUnique({
      where: { id: rolloutId },
      include: {
        deployment: {
          include: {
            service: { select: { id: true, workspaceId: true, runtime: true, slug: true } },
            environment: { select: { kind: true } },
          },
        },
        serviceVersion: {
          include: { artifacts: { select: { kind: true, content: true } } },
        },
      },
    });
    if (!rollout) throw new NotFoundException('Rollout not found');

    const sv = rollout.serviceVersion;
    const envVars = (sv.envVars as Array<{ key: string; value: string; secret: boolean }>) ?? [];

    const dockerfile = sv.artifacts.find((a) => a.kind === 'DOCKERFILE')?.content;
    const k8sManifests = sv.artifacts
      .filter((a) => a.kind === 'K8S_MANIFEST')
      .map((a) => a.content);

    const input: ScanInput = {
      serviceVersionId: sv.id,
      runtime: rollout.deployment.service.runtime,
      dockerfile,
      k8sManifests,
      envVars,
      replicas: sv.replicas,
      cpuMillicores: sv.cpuMillicores,
      memoryMb: sv.memoryMb,
      healthcheckPath: sv.healthcheckPath,
      environmentKind: rollout.deployment.environment.kind,
    };

    const result = await this.scanner.scan(input);

    // Delete existing report if any (for rescan support)
    await this.prisma.securityReport.deleteMany({ where: { rolloutId } });

    const report = await this.prisma.securityReport.create({
      data: {
        rolloutId,
        passed: result.passed,
        score: result.score,
        critical: result.findings.filter((f) => f.severity === 'CRITICAL').length,
        high: result.findings.filter((f) => f.severity === 'HIGH').length,
        medium: result.findings.filter((f) => f.severity === 'MEDIUM').length,
        low: result.findings.filter((f) => f.severity === 'LOW').length,
        info: result.findings.filter((f) => f.severity === 'INFO').length,
        scannerName: result.scannerName,
        findings: {
          create: result.findings.map((f) => ({
            kind: f.kind,
            severity: f.severity,
            ruleId: f.ruleId,
            title: f.title,
            description: f.description,
            location: f.location ?? null,
            remediation: f.remediation ?? null,
          })),
        },
      },
      include: { findings: true },
    });

    const workspaceId = rollout.deployment.service.workspaceId;
    await this.audit.record({
      workspaceId,
      action: result.passed ? AuditAction.SCAN_PASSED : AuditAction.SCAN_FAILED,
      subjectKind: 'rollout',
      subjectId: rolloutId,
      metadata: { score: result.score, findingCount: result.findings.length, passed: result.passed },
    });

    return report;
  }

  async getByRolloutId(rolloutId: string, workspaceId: string) {
    const report = await this.prisma.securityReport.findUnique({
      where: { rolloutId },
      include: {
        findings: true,
        rollout: {
          include: {
            deployment: {
              include: { service: { select: { workspaceId: true } } },
            },
          },
        },
      },
    });
    if (!report) throw new NotFoundException('Security report not found');
    if (report.rollout.deployment.service.workspaceId !== workspaceId) {
      throw new NotFoundException('Security report not found');
    }

    const { rollout, ...rest } = report;
    return rest;
  }

  async getByServiceId(serviceId: string, workspaceId: string) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, workspaceId },
      select: { id: true },
    });
    if (!service) throw new NotFoundException('Service not found');

    return this.prisma.securityReport.findMany({
      where: {
        rollout: {
          deployment: { serviceId },
        },
      },
      include: { findings: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async rescan(rolloutId: string, workspaceId: string) {
    // Verify ownership
    const rollout = await this.prisma.rollout.findUnique({
      where: { id: rolloutId },
      include: {
        deployment: { include: { service: { select: { workspaceId: true } } } },
      },
    });
    if (!rollout) throw new NotFoundException('Rollout not found');
    if (rollout.deployment.service.workspaceId !== workspaceId) {
      throw new NotFoundException('Rollout not found');
    }

    return this.scan(rolloutId);
  }
}
