import { describe, it, expect } from 'vitest';

/**
 * Unit tests for the CostService pricing math.
 *
 * Extracted as pure functions to avoid needing NestJS DI.
 * These match the exact formulas in cost.service.ts.
 */

// ── Pricing constants (must match cost.service.ts) ──────────

const PRICING = {
  cpuPerMillicoreHour: 0.00003,
  memoryPerMbHour: 0.00005,
  egressPerGb: 0.09,
  storagePerGbMonth: 0.10,
  hoursPerMonth: 730,
};

interface CostInput {
  replicas: number;
  cpuMillicores: number;
  memoryMb: number;
  egressGbPerMonth: number;
  storageGb: number;
}

interface CostWarning {
  code: string;
  message: string;
  severity: string;
}

interface CostSuggestion {
  code: string;
  message: string;
  estimatedMonthlySavingsUsd: number;
}

function estimate(input: CostInput) {
  const { replicas, cpuMillicores, memoryMb, egressGbPerMonth, storageGb } = input;

  const cpuUsd = cpuMillicores * PRICING.hoursPerMonth * PRICING.cpuPerMillicoreHour * replicas;
  const memoryUsd = memoryMb * PRICING.hoursPerMonth * PRICING.memoryPerMbHour * replicas;
  const egressUsd = egressGbPerMonth * PRICING.egressPerGb;
  const storageUsd = storageGb * PRICING.storagePerGbMonth;
  const monthlyUsd = cpuUsd + memoryUsd + egressUsd + storageUsd;

  return {
    monthlyUsd: Math.round(monthlyUsd * 100) / 100,
    cpuUsd: Math.round(cpuUsd * 100) / 100,
    memoryUsd: Math.round(memoryUsd * 100) / 100,
    egressUsd: Math.round(egressUsd * 100) / 100,
    storageUsd: Math.round(storageUsd * 100) / 100,
    warnings: generateWarnings(input),
    suggestions: generateSuggestions(input),
    pricingVersion: 'v1',
  };
}

function generateWarnings(input: CostInput): CostWarning[] {
  const warnings: CostWarning[] = [];
  const { memoryMb, cpuMillicores, replicas } = input;

  if (memoryMb >= 2048) {
    warnings.push({ code: 'HIGH_MEMORY', message: `Memory is set to ${memoryMb}Mi`, severity: 'WARN' });
  }
  if (cpuMillicores < 250) {
    warnings.push({ code: 'LOW_CPU', message: `CPU is set to ${cpuMillicores}m`, severity: 'CRITICAL' });
  }
  if (replicas > 5) {
    warnings.push({ code: 'HIGH_REPLICAS', message: `Running ${replicas} replicas`, severity: 'WARN' });
  }
  if (cpuMillicores > 0 && memoryMb / cpuMillicores > 4) {
    warnings.push({ code: 'MEMORY_CPU_RATIO', message: 'Memory-to-CPU ratio is high', severity: 'WARN' });
  }
  return warnings;
}

function generateSuggestions(input: CostInput): CostSuggestion[] {
  const suggestions: CostSuggestion[] = [];
  const { memoryMb, cpuMillicores, replicas } = input;

  if (memoryMb >= 1024) {
    const targetMb = 512;
    const saving = (memoryMb - targetMb) * PRICING.hoursPerMonth * PRICING.memoryPerMbHour * replicas;
    suggestions.push({
      code: 'RIGHTSIZE_MEMORY',
      message: `Reduce memory from ${memoryMb}Mi to ${targetMb}Mi`,
      estimatedMonthlySavingsUsd: Math.round(saving * 100) / 100,
    });
  }
  if (replicas > 3) {
    const targetReplicas = 3;
    const savingCpu = cpuMillicores * PRICING.hoursPerMonth * PRICING.cpuPerMillicoreHour * (replicas - targetReplicas);
    const savingMem = memoryMb * PRICING.hoursPerMonth * PRICING.memoryPerMbHour * (replicas - targetReplicas);
    suggestions.push({
      code: 'REDUCE_REPLICAS',
      message: `Reduce replicas from ${replicas} to ${targetReplicas}`,
      estimatedMonthlySavingsUsd: Math.round((savingCpu + savingMem) * 100) / 100,
    });
  }
  if (cpuMillicores >= 1000) {
    const targetCpu = 750;
    const saving = (cpuMillicores - targetCpu) * PRICING.hoursPerMonth * PRICING.cpuPerMillicoreHour * replicas;
    suggestions.push({
      code: 'RIGHTSIZE_CPU',
      message: `Reduce CPU from ${cpuMillicores}m to ${targetCpu}m`,
      estimatedMonthlySavingsUsd: Math.round(saving * 100) / 100,
    });
  }
  return suggestions;
}

// ── Tests ───────────────────────────────────────────────────

describe('Cost estimation', () => {
  describe('pricing math', () => {
    it('calculates CPU cost correctly for single replica', () => {
      // 500 millicores * 730 hours * $0.00003/millicore-hour = $10.95
      const result = estimate({ replicas: 1, cpuMillicores: 500, memoryMb: 0, egressGbPerMonth: 0, storageGb: 0 });
      expect(result.cpuUsd).toBe(10.95);
    });

    it('calculates memory cost correctly for single replica', () => {
      // 512 MB * 730 hours * $0.00005/MB-hour = $18.69
      const result = estimate({ replicas: 1, cpuMillicores: 0, memoryMb: 512, egressGbPerMonth: 0, storageGb: 0 });
      expect(result.memoryUsd).toBe(18.69);
    });

    it('calculates egress cost correctly', () => {
      // 50 GB * $0.09/GB = $4.50
      const result = estimate({ replicas: 1, cpuMillicores: 0, memoryMb: 0, egressGbPerMonth: 50, storageGb: 0 });
      expect(result.egressUsd).toBe(4.50);
    });

    it('calculates storage cost correctly', () => {
      // 10 GB * $0.10/GB = $1.00
      const result = estimate({ replicas: 1, cpuMillicores: 0, memoryMb: 0, egressGbPerMonth: 0, storageGb: 10 });
      expect(result.storageUsd).toBe(1.00);
    });

    it('scales linearly with replicas', () => {
      const single = estimate({ replicas: 1, cpuMillicores: 500, memoryMb: 512, egressGbPerMonth: 50, storageGb: 10 });
      const double = estimate({ replicas: 2, cpuMillicores: 500, memoryMb: 512, egressGbPerMonth: 50, storageGb: 10 });

      // CPU and memory double with replicas; egress and storage do not
      expect(double.cpuUsd).toBeCloseTo(single.cpuUsd * 2, 2);
      expect(double.memoryUsd).toBeCloseTo(single.memoryUsd * 2, 2);
      expect(double.egressUsd).toBe(single.egressUsd);
      expect(double.storageUsd).toBe(single.storageUsd);
    });

    it('sums all components for monthly total', () => {
      const result = estimate({ replicas: 2, cpuMillicores: 500, memoryMb: 512, egressGbPerMonth: 50, storageGb: 10 });
      const expected = result.cpuUsd + result.memoryUsd + result.egressUsd + result.storageUsd;
      expect(result.monthlyUsd).toBe(Math.round(expected * 100) / 100);
    });

    it('returns 0 for zero resources', () => {
      const result = estimate({ replicas: 1, cpuMillicores: 0, memoryMb: 0, egressGbPerMonth: 0, storageGb: 0 });
      expect(result.monthlyUsd).toBe(0);
      expect(result.cpuUsd).toBe(0);
      expect(result.memoryUsd).toBe(0);
      expect(result.egressUsd).toBe(0);
      expect(result.storageUsd).toBe(0);
    });
  });

  describe('seed data consistency', () => {
    it('api-prod cost matches seed data', () => {
      // api-prod: 2 replicas, 500 cpu, 512 mem, 50 GB egress, 10 GB storage
      const result = estimate({ replicas: 2, cpuMillicores: 500, memoryMb: 512, egressGbPerMonth: 50, storageGb: 10 });
      expect(result.cpuUsd).toBe(21.90);
      expect(result.memoryUsd).toBe(37.38);
      expect(result.egressUsd).toBe(4.50);
      expect(result.storageUsd).toBe(1.00);
      expect(result.monthlyUsd).toBe(64.78);
    });

    it('web-dev cost matches seed data', () => {
      // web-dev: 2 replicas, 250 cpu, 256 mem
      const result = estimate({ replicas: 2, cpuMillicores: 250, memoryMb: 256, egressGbPerMonth: 50, storageGb: 10 });
      expect(result.cpuUsd).toBe(10.95);
      expect(result.memoryUsd).toBe(18.69);
      expect(result.monthlyUsd).toBe(35.14);
    });

    it('worker-dev cost matches seed data', () => {
      // worker-dev: 1 replica, 1000 cpu, 2048 mem
      // memory: 2048 * 730 * 0.00005 = 74.75
      const result = estimate({ replicas: 1, cpuMillicores: 1000, memoryMb: 2048, egressGbPerMonth: 50, storageGb: 10 });
      expect(result.cpuUsd).toBe(21.90);
      expect(result.memoryUsd).toBe(74.75);
      expect(result.monthlyUsd).toBe(102.15);
    });
  });

  describe('warnings', () => {
    it('warns on high memory (>= 2048 Mi)', () => {
      const { warnings } = estimate({ replicas: 1, cpuMillicores: 500, memoryMb: 4096, egressGbPerMonth: 50, storageGb: 10 });
      expect(warnings.some((w) => w.code === 'HIGH_MEMORY')).toBe(true);
    });

    it('does not warn on normal memory', () => {
      const { warnings } = estimate({ replicas: 1, cpuMillicores: 500, memoryMb: 512, egressGbPerMonth: 50, storageGb: 10 });
      expect(warnings.some((w) => w.code === 'HIGH_MEMORY')).toBe(false);
    });

    it('warns on low CPU (< 250m)', () => {
      const { warnings } = estimate({ replicas: 1, cpuMillicores: 100, memoryMb: 256, egressGbPerMonth: 50, storageGb: 10 });
      expect(warnings.some((w) => w.code === 'LOW_CPU')).toBe(true);
    });

    it('warns on high replica count (> 5)', () => {
      const { warnings } = estimate({ replicas: 8, cpuMillicores: 500, memoryMb: 512, egressGbPerMonth: 50, storageGb: 10 });
      expect(warnings.some((w) => w.code === 'HIGH_REPLICAS')).toBe(true);
    });

    it('warns on high memory-to-CPU ratio', () => {
      // 2048 mem / 250 cpu = 8.19 > 4
      const { warnings } = estimate({ replicas: 1, cpuMillicores: 250, memoryMb: 2048, egressGbPerMonth: 50, storageGb: 10 });
      expect(warnings.some((w) => w.code === 'MEMORY_CPU_RATIO')).toBe(true);
    });

    it('does not warn on balanced ratio', () => {
      // 512 mem / 500 cpu = 1.024 < 4
      const { warnings } = estimate({ replicas: 1, cpuMillicores: 500, memoryMb: 512, egressGbPerMonth: 50, storageGb: 10 });
      expect(warnings.some((w) => w.code === 'MEMORY_CPU_RATIO')).toBe(false);
    });
  });

  describe('suggestions', () => {
    it('suggests right-sizing memory when >= 1024 Mi', () => {
      const { suggestions } = estimate({ replicas: 1, cpuMillicores: 500, memoryMb: 2048, egressGbPerMonth: 50, storageGb: 10 });
      const memSuggestion = suggestions.find((s) => s.code === 'RIGHTSIZE_MEMORY');
      expect(memSuggestion).toBeDefined();
      expect(memSuggestion!.estimatedMonthlySavingsUsd).toBeGreaterThan(0);
    });

    it('does not suggest right-sizing memory when < 1024 Mi', () => {
      const { suggestions } = estimate({ replicas: 1, cpuMillicores: 500, memoryMb: 512, egressGbPerMonth: 50, storageGb: 10 });
      expect(suggestions.some((s) => s.code === 'RIGHTSIZE_MEMORY')).toBe(false);
    });

    it('suggests reducing replicas when > 3', () => {
      const { suggestions } = estimate({ replicas: 5, cpuMillicores: 500, memoryMb: 512, egressGbPerMonth: 50, storageGb: 10 });
      const replicaSuggestion = suggestions.find((s) => s.code === 'REDUCE_REPLICAS');
      expect(replicaSuggestion).toBeDefined();
      expect(replicaSuggestion!.estimatedMonthlySavingsUsd).toBeGreaterThan(0);
    });

    it('suggests right-sizing CPU when >= 1000m', () => {
      const { suggestions } = estimate({ replicas: 1, cpuMillicores: 1500, memoryMb: 512, egressGbPerMonth: 50, storageGb: 10 });
      const cpuSuggestion = suggestions.find((s) => s.code === 'RIGHTSIZE_CPU');
      expect(cpuSuggestion).toBeDefined();
      expect(cpuSuggestion!.estimatedMonthlySavingsUsd).toBeGreaterThan(0);
    });

    it('computes correct memory savings', () => {
      // 2048 → 512 = 1536 MB saved * 730 hours * $0.00005/MB-hr * 1 replica = $56.06
      const { suggestions } = estimate({ replicas: 1, cpuMillicores: 500, memoryMb: 2048, egressGbPerMonth: 50, storageGb: 10 });
      const memSuggestion = suggestions.find((s) => s.code === 'RIGHTSIZE_MEMORY');
      expect(memSuggestion!.estimatedMonthlySavingsUsd).toBeCloseTo(56.06, 1);
    });

    it('computes correct CPU savings', () => {
      // 1500 → 750 = 750 millicores saved * 730 hours * $0.00003/hr * 1 replica = $16.43
      const { suggestions } = estimate({ replicas: 1, cpuMillicores: 1500, memoryMb: 256, egressGbPerMonth: 50, storageGb: 10 });
      const cpuSuggestion = suggestions.find((s) => s.code === 'RIGHTSIZE_CPU');
      expect(cpuSuggestion!.estimatedMonthlySavingsUsd).toBeCloseTo(16.43, 1);
    });

    it('suggests nothing for a well-provisioned service', () => {
      const { suggestions } = estimate({ replicas: 2, cpuMillicores: 500, memoryMb: 512, egressGbPerMonth: 50, storageGb: 10 });
      expect(suggestions).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('handles zero replicas without error', () => {
      const result = estimate({ replicas: 0, cpuMillicores: 500, memoryMb: 512, egressGbPerMonth: 50, storageGb: 10 });
      expect(result.cpuUsd).toBe(0);
      expect(result.memoryUsd).toBe(0);
      expect(result.monthlyUsd).toBe(5.50); // egress + storage only
    });

    it('handles very large resource allocation', () => {
      const result = estimate({ replicas: 100, cpuMillicores: 10000, memoryMb: 32768, egressGbPerMonth: 10000, storageGb: 1000 });
      expect(result.monthlyUsd).toBeGreaterThan(0);
      expect(Number.isFinite(result.monthlyUsd)).toBe(true);
    });

    it('rounds to 2 decimal places', () => {
      const result = estimate({ replicas: 1, cpuMillicores: 333, memoryMb: 333, egressGbPerMonth: 33, storageGb: 3 });
      expect(result.monthlyUsd.toString().split('.')[1]?.length ?? 0).toBeLessThanOrEqual(2);
      expect(result.cpuUsd.toString().split('.')[1]?.length ?? 0).toBeLessThanOrEqual(2);
    });
  });
});
