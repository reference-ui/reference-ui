/**
 * The per-file rule tiers of the Core quality gate: the function and file metric thresholds, the suppression ban, and
 * the header and README prose checks. Each rule takes the collected files or their measured metrics and returns
 * Violation records, so run.ts can merge them with the tool tiers.
 */
import path from 'node:path';
import type { FileMetric, MetricsResult } from './metrics.ts';
import { checkHeader, checkReadme, type Violation } from './prose.ts';
import type { Severity } from './tools.ts';
import { CORE_DIR, isGenerated } from './walk.ts';

// Split so this file never contains the banned pragmas that it scans for.
const BIOME_NEEDLE = 'biome-' + 'ignore';
const TS_IGNORE = '@ts-' + 'ignore';
const TS_EXPECT = '@ts-expect-' + 'error';

export interface Measured {
  result: MetricsResult | null;
  missing: string | null;
}

type FnMetricKey = 'cyclomatic' | 'params' | 'depth' | 'lines';
const FN_TIERS: Array<[FnMetricKey, string, number, number | null]> = [
  ['cyclomatic', 'core/cyclomatic', 12, 8],
  ['params', 'core/params', 5, 4],
  ['depth', 'core/depth', 4, null],
  ['lines', 'core/function-lines', 120, 80],
];

function tierHit(value: number, fail: number, warn: number | null): Severity | 0 {
  if (value > fail) return 2;
  if (warn !== null && value > warn) return 1;
  return 0;
}

export function metricsViolations(result: MetricsResult, texts: Map<string, string | null>): { errors: Violation[]; warnings: Violation[] } {
  const errors: Violation[] = [];
  const warnings: Violation[] = [];
  for (const fn of result.functions) {
    const skipLen = isGenerated(fn.file, texts.get(fn.file));
    // Generated files skip the length tier but keep the shape tiers.
    const tiers = skipLen ? FN_TIERS.filter(([key]) => key !== 'lines') : FN_TIERS;
    tiers.forEach(([key, rule, fail, warn]) => {
      const sev = tierHit(fn[key], fail, warn);
      if (!sev) return;
      const tierNote = sev === 2 ? `fail above ${fail}` : `warn above ${warn}`;
      (sev === 2 ? errors : warnings).push({
        file: fn.file,
        line: fn.line,
        ruleId: rule,
        severity: sev,
        message: `${rule}: ${fn.name} measures ${key} ${fn[key]} (${tierNote}).`,
      });
    });
  }
  fileMetricsViolations(result.files, texts, errors, warnings);
  return { errors, warnings };
}

function fileMetricsViolations(files: FileMetric[], texts: Map<string, string | null>, errors: Violation[], warnings: Violation[]): void {
  for (const row of files) {
    if (isGenerated(row.file, texts.get(row.file))) continue;
    const sev = tierHit(row.lines, 500, 365);
    if (!sev) continue;
    const tierNote = sev === 2 ? 'fail above 500' : 'warn above 365';
    (sev === 2 ? errors : warnings).push({
      file: row.file,
      line: 1,
      ruleId: 'core/file-lines',
      severity: sev,
      message: `core/file-lines: ${row.lines} lines (${tierNote}).`,
    });
  }
}

function bareExpectError(line: string): boolean {
  const at = line.indexOf(TS_EXPECT);
  if (at < 0) return false;
  const rest = line.slice(at + TS_EXPECT.length).replace(/^[\s:;-]+/, '');
  return rest.length < 10;
}

function scanSuppressions(files: string[], texts: Map<string, string | null>): Violation[] {
  const hits: Violation[] = [];
  for (const file of files) {
    const lines = (texts.get(file) ?? '').split('\n');
    lines.forEach((line, idx) => {
      if (line.includes(BIOME_NEEDLE))
        hits.push({ file, line: idx + 1, ruleId: 'core/suppression', severity: 2, message: 'you-ignored-a-rule-we-set-up-dont: a suppression comment cannot land; fix the code instead.' });
      if (line.includes(TS_IGNORE))
        hits.push({ file, line: idx + 1, ruleId: 'core/suppression', severity: 2, message: 'you-ignored-a-rule-we-set-up-dont: a ts-ignore comment cannot land; fix the types instead.' });
      if (bareExpectError(line))
        hits.push({
          file,
          line: idx + 1,
          ruleId: 'core/suppression',
          severity: 2,
          message: 'you-ignored-a-rule-we-set-up-dont: a bare ts-expect-error cannot land; justify it on the same line (10+ chars) or fix the types.',
        });
    });
  }
  return hits;
}

export function proseTier(code: string[], readmes: string[], texts: Map<string, string | null>): Violation[] {
  const errors = [...scanSuppressions(code, texts)];
  for (const f of code) {
    const v = checkHeader(f, texts.get(f));
    if (v) errors.push(v);
  }
  const casesPrefix = path.join(CORE_DIR, 'tests', 'cases') + path.sep;
  for (const f of readmes) {
    if (f.startsWith(casesPrefix)) continue; // case READMEs are never a failure: convention, not gate.
    const v = checkReadme(f, texts.get(f));
    if (v) errors.push(v);
  }
  return errors;
}
