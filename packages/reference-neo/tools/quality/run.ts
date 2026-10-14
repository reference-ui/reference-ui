/**
 * Orchestrates the Neo quality gate and reports a single numeric exit code. It takes argv paths, collects their files,
 * runs the tool tiers and the rule tiers, and prints the grouped findings with tips. The walk, the tool runners, the
 * rules and the reporting each live in a sibling module.
 */
import path from 'node:path';
import { readTextFiles } from './files.ts';
import { measureFiles } from './metrics.ts';
import type { Violation } from './prose.ts';
import { metricsViolations, proseTier, type Measured } from './rules.ts';
import { printGroup, runReport } from './report.ts';
import { biomeTier, tscTier } from './tools.ts';
import { collect, resolveTargets } from './walk.ts';
import { vendorTier } from './vendor.ts';

interface GateCtx {
  code: string[];
  readmes: string[];
  texts: Map<string, string | null>;
  measured: Measured;
  started: number;
}

function parseArgs(argv: string[]): { report: boolean; paths: string[] } {
  return {
    report: argv.includes('--report'),
    paths: argv
      .filter((a) => !a.startsWith('-'))
      .map((p) => path.resolve(p)),
  };
}

async function runGate(ctx: GateCtx): Promise<number> {
  const errors: Violation[] = [];
  const warnings: Violation[] = [];
  let missingTool = ctx.measured.missing;
  // Vendor freshness first and always: a drifted shelf means the tree cannot land.
  errors.push(...(await vendorTier()));
  const tier = await biomeTier(ctx.code);
  errors.push(...tier.errors);
  warnings.push(...tier.warnings);
  missingTool = tier.missing ?? missingTool;
  if (ctx.measured.result) {
    const v = metricsViolations(ctx.measured.result, ctx.texts);
    errors.push(...v.errors);
    warnings.push(...v.warnings);
  }
  errors.push(...proseTier(ctx.code, ctx.readmes, ctx.texts));
  const tsc = await tscTier(ctx.code);
  errors.push(...tsc.errors);
  missingTool = tsc.missing ?? missingTool;
  const sorts = (a: Violation, b: Violation): number => (a.file < b.file ? -1 : a.file > b.file ? 1 : a.line - b.line);
  const groups: Array<[string, Violation[]]> = [
    ['suppressions', errors.filter((v) => v.ruleId === 'neo/suppression').sort(sorts)],
    ['errors', errors.filter((v) => v.ruleId !== 'neo/suppression').sort(sorts)],
    ['warnings (non-failing)', warnings.sort(sorts)],
  ];
  for (const [title, vs] of groups) if (vs.length) printGroup(title, vs);
  console.log(`[neo-quality] ${errors.length} errors, ${warnings.length} warnings, ${ctx.code.length} files in ${Date.now() - ctx.started}ms`);
  if (missingTool) {
    console.log(`[neo-quality] tooling unavailable: ${missingTool} is not installed or did not run to completion; install dependencies and rerun (a killed process is named above).`);
    return 2;
  }
  return errors.length ? 1 : 0;
}

function toolingCode(err: unknown): string | undefined {
  return (err as { code?: string } | null | undefined)?.code;
}

export async function runQuality(argv: string[] = []): Promise<number> {
  const started = Date.now();
  const { report, paths } = parseArgs(argv);
  const existing = await resolveTargets(paths);
  const { code, readmes } = await collect(existing);
  const texts = await readTextFiles([...code, ...readmes]);
  let measured: Measured = { result: { functions: [], files: [] }, missing: null };
  if (code.length) {
    try {
      measured = { result: measureFiles(code), missing: null };
    } catch (err) {
      if (toolingCode(err) === 'NEO_TOOLING_MISSING') measured = { result: null, missing: 'typescript' };
      else throw err;
    }
  }
  if (report) return runReport(measured, code, started);
  // A gate pointed at paths that yield no file inspected nothing; that must not read as a pass.
  if (paths.length > 0 && code.length === 0 && readmes.length === 0) {
    console.log('[neo-quality] nothing to check: no code or README files under the given paths. A gate that inspects nothing does not pass.');
    return 1;
  }
  return runGate({ code, readmes, texts, measured, started });
}
