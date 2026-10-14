/**
 * The --report output of the Neo quality gate, which prints the complexity distribution and the Biome cognitive
 * summary, and the grouped printer the gate uses for its findings. A report run exits 0 unless the metrics tier is
 * unavailable, so a report never fails on its own findings.
 */
import type { FunctionMetric, MetricsResult } from './metrics.ts';
import type { Violation } from './prose.ts';
import type { Measured } from './rules.ts';
import { tipFor } from './tips.ts';
import { biomeTier } from './tools.ts';

const COGNITIVE_HIT = /complexity of (\d+) detected/;

function topLabels<T>(items: T[], pick: (item: T) => number, labelOf: (item: T) => string): string[] {
  const rows = items.map((item) => ({ label: labelOf(item), value: pick(item) })).sort((a, b) => b.value - a.value);
  return rows.slice(0, 5).map((row) => `${row.label}=${row.value}`);
}

function reportMetric(title: string, values: number[], tops: string[]): void {
  if (!values.length) {
    console.log(`[neo-quality] report ${title}: no data`);
    return;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const at = (p: number): number => sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))];
  console.log(`[neo-quality] report ${title}: p50 ${at(50)} p95 ${at(95)} max ${sorted[sorted.length - 1]}`);
  console.log(`[neo-quality]   top: ${tops.join(', ')}`);
}

function reportCognitive(cognitive: Violation[]): void {
  const best = new Map<string, number>();
  for (const d of cognitive) {
    const value = Number(d.message.match(COGNITIVE_HIT)?.[1] ?? 0);
    const key = `${d.file}:${d.line}`;
    if (value > (best.get(key) ?? 0)) best.set(key, value);
  }
  if (!best.size) {
    console.log('[neo-quality] report cognitive: no function above 12');
    return;
  }
  const tops = [...best.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, v]) => `${k}=${v}`);
  const max = [...best.values()].sort((a, b) => a - b).pop();
  console.log(`[neo-quality] report cognitive (Biome, observes above 12 only): max ${max} across ${best.size} functions`);
  console.log(`[neo-quality]   top: ${tops.join(', ')}`);
}

function reportTier(result: MetricsResult, cognitive: Violation[]): void {
  const fns: FunctionMetric[] = result.functions;
  console.log(`[neo-quality] report: ${fns.length} functions, ${result.files.length} files`);
  const fnLabel = (f: FunctionMetric): string => `${f.file}:${f.line} ${f.name}`;
  reportMetric('cyclomatic', fns.map((f) => f.cyclomatic), topLabels(fns, (f) => f.cyclomatic, fnLabel));
  reportMetric('params', fns.map((f) => f.params), topLabels(fns, (f) => f.params, fnLabel));
  reportMetric('depth', fns.map((f) => f.depth), topLabels(fns, (f) => f.depth, fnLabel));
  reportMetric('function-lines', fns.map((f) => f.lines), topLabels(fns, (f) => f.lines, fnLabel));
  reportMetric('file-lines', result.files.map((r) => r.lines), topLabels(result.files, (r) => r.lines, (r) => r.file));
  reportCognitive(cognitive);
}

export function printGroup(title: string, violations: Violation[]): void {
  console.log(`[neo-quality] ${title} (${violations.length}):`);
  for (const v of violations) {
    console.log(`  ${v.severity === 2 ? 'error' : 'warn'} ${v.file}:${v.line} ${v.ruleId ?? 'unknown'} ${v.message}`);
    const tip = tipFor(v.ruleId);
    if (tip) console.log(`    tip: ${tip}`);
  }
}

export async function runReport(measured: Measured, code: string[], started: number): Promise<number> {
  if (!measured.result) {
    console.log('[neo-quality] report unavailable: typescript is not installed; install dependencies and rerun.');
    return 2;
  }
  let cognitive: Violation[] = [];
  if (code.length) {
    const tier = await biomeTier(code);
    cognitive = tier.cognitive;
    if (tier.missing) console.log('[neo-quality] report cognitive: skipped (biome is not installed).');
  }
  reportTier(measured.result, cognitive);
  console.log(`[neo-quality] report done in ${Date.now() - started}ms`);
  return 0;
}
