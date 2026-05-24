import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CostBreakdown, CostInput, CostSuggestion, CostWarning } from '@forgeops/types';

// Pricing rates (monthly USD)
// Based on AWS EKS/GKE-style pricing. 730 hours/month.
// CPU:   ~$0.03/core-hour  → $0.00003/millicore-hour
// Memory: ~$0.05/GB-hour   → $0.00005/MB-hour
// Egress: $0.09/GB
// Storage: $0.10/GB-month
const PRICING = {
  cpuPerMillicoreHour: 0.00003,
  memoryPerMbHour: 0.00005,
  egressPerGb: 0.09,
  storagePerGbMonth: 0.10,
  hoursPerMonth: 730,
};

const PRICING_VERSION = 'v1';

@Injectable()
export class CostService {
  constructor(private readonly prisma: PrismaService) {}

  estimate(input: CostInput): CostBreakdown {
    const { replicas, cpuMillicores, memoryMb, egressGbPerMonth, storageGb } = input;

    const cpuUsd = cpuMillicores * PRICING.hoursPerMonth * PRICING.cpuPerMillicoreHour * replicas;
    const memoryUsd = memoryMb * PRICING.hoursPerMonth * PRICING.memoryPerMbHour * replicas;
    const egressUsd = egressGbPerMonth * PRICING.egressPerGb;
    const storageUsd = storageGb * PRICING.storagePerGbMonth;
    const monthlyUsd = cpuUsd + memoryUsd + egressUsd + storageUsd;

    const warnings = this.generateWarnings(input);
    const suggestions = this.generateSuggestions(input);

    return {
      monthlyUsd: Math.round(monthlyUsd * 100) / 100,
      cpuUsd: Math.round(cpuUsd * 100) / 100,
      memoryUsd: Math.round(memoryUsd * 100) / 100,
      egressUsd: Math.round(egressUsd * 100) / 100,
      storageUsd: Math.round(storageUsd * 100) / 100,
      warnings,
      suggestions,
      pricingVersion: PRICING_VERSION,
    };
  }

  async createFromRollout(rolloutId: string) {
    const rollout = await this.prisma.rollout.findUnique({
      where: { id: rolloutId },
      include: { serviceVersion: true },
    });
    if (!rollout) throw new NotFoundException('Rollout not found');

    const sv = rollout.serviceVersion;
    const input: CostInput = {
      replicas: sv.replicas,
      cpuMillicores: sv.cpuMillicores,
      memoryMb: sv.memoryMb,
      egressGbPerMonth: 50, // default estimate
      storageGb: 10, // default estimate
    };

    const breakdown = this.estimate(input);

    // Delete existing estimate if any
    await this.prisma.costEstimate.deleteMany({ where: { rolloutId } });

    return this.prisma.costEstimate.create({
      data: {
        rolloutId,
        monthlyUsd: breakdown.monthlyUsd,
        cpuUsd: breakdown.cpuUsd,
        memoryUsd: breakdown.memoryUsd,
        egressUsd: breakdown.egressUsd,
        storageUsd: breakdown.storageUsd,
        warnings: breakdown.warnings as any,
        suggestions: breakdown.suggestions as any,
        pricingVersion: PRICING_VERSION,
      },
    });
  }

  async getByRolloutId(rolloutId: string, workspaceId: string) {
    const estimate = await this.prisma.costEstimate.findUnique({
      where: { rolloutId },
      include: {
        rollout: {
          include: {
            deployment: { include: { service: { select: { workspaceId: true } } } },
          },
        },
      },
    });
    if (!estimate) throw new NotFoundException('Cost estimate not found');
    if (estimate.rollout.deployment.service.workspaceId !== workspaceId) {
      throw new NotFoundException('Cost estimate not found');
    }

    const { rollout, ...rest } = estimate;
    return rest;
  }

  async getByServiceId(serviceId: string, workspaceId: string) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, workspaceId },
      select: { id: true },
    });
    if (!service) throw new NotFoundException('Service not found');

    return this.prisma.costEstimate.findMany({
      where: { rollout: { deployment: { serviceId } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  private generateWarnings(input: CostInput): CostWarning[] {
    const warnings: CostWarning[] = [];
    const { memoryMb, cpuMillicores, replicas } = input;

    if (memoryMb >= 2048) {
      warnings.push({
        code: 'HIGH_MEMORY',
        message: `Memory is set to ${memoryMb}Mi — this may be overprovisioned for most workloads.`,
        severity: 'WARN',
      });
    }

    if (cpuMillicores < 250) {
      warnings.push({
        code: 'LOW_CPU',
        message: `CPU is set to ${cpuMillicores}m — this may be underprovisioned and cause throttling.`,
        severity: 'CRITICAL',
      });
    }

    if (replicas > 5) {
      warnings.push({
        code: 'HIGH_REPLICAS',
        message: `Running ${replicas} replicas — ensure this matches actual traffic demand.`,
        severity: 'WARN',
      });
    }

    if (cpuMillicores > 0 && memoryMb / cpuMillicores > 4) {
      warnings.push({
        code: 'MEMORY_CPU_RATIO',
        message: 'Memory-to-CPU ratio is unusually high. Consider balancing resource allocation.',
        severity: 'WARN',
      });
    }

    return warnings;
  }

  private generateSuggestions(input: CostInput): CostSuggestion[] {
    const suggestions: CostSuggestion[] = [];
    const { memoryMb, cpuMillicores, replicas, egressGbPerMonth, storageGb } = input;

    // Suggest right-sizing memory
    if (memoryMb >= 1024) {
      const targetMb = 512;
      const savingMemory = (memoryMb - targetMb) * PRICING.hoursPerMonth * PRICING.memoryPerMbHour * replicas;
      suggestions.push({
        code: 'RIGHTSIZE_MEMORY',
        message: `Reduce memory from ${memoryMb}Mi to ${targetMb}Mi if workload permits.`,
        estimatedMonthlySavingsUsd: Math.round(savingMemory * 100) / 100,
      });
    }

    // Suggest reducing replicas
    if (replicas > 3) {
      const targetReplicas = 3;
      const savingCpu = cpuMillicores * PRICING.hoursPerMonth * PRICING.cpuPerMillicoreHour * (replicas - targetReplicas);
      const savingMem = memoryMb * PRICING.hoursPerMonth * PRICING.memoryPerMbHour * (replicas - targetReplicas);
      suggestions.push({
        code: 'REDUCE_REPLICAS',
        message: `Reduce replicas from ${replicas} to ${targetReplicas} to match typical traffic patterns.`,
        estimatedMonthlySavingsUsd: Math.round((savingCpu + savingMem) * 100) / 100,
      });
    }

    // Suggest right-sizing CPU
    if (cpuMillicores >= 1000) {
      const targetCpu = 750;
      const saving = (cpuMillicores - targetCpu) * PRICING.hoursPerMonth * PRICING.cpuPerMillicoreHour * replicas;
      suggestions.push({
        code: 'RIGHTSIZE_CPU',
        message: `Reduce CPU from ${cpuMillicores}m to ${targetCpu}m if utilization is consistently low.`,
        estimatedMonthlySavingsUsd: Math.round(saving * 100) / 100,
      });
    }

    return suggestions;
  }
}
