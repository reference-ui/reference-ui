/**
 * Plumbing that runs the Neo quality gate and reports a single numeric exit code. It takes argv
 * paths (defaulting to the Neo sources and harness), shells out to Biome twice plus a strict tsc
 * project pass, then adds the metrics tiers and the suppression and prose checks before printing tips.
 */
import { execFile } from 'node:child_process';
import type { Stats } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readTextFiles } from './files.ts';
import { measureFiles, type FileMetric, type FunctionMetric, type MetricsResult } from './metrics.ts';
import { checkHeader, checkReadme, type Violation } from './prose.ts';
import { tipFor } from './tips.ts';

const HERE: string = path.dirname(fileURLToPath(import.meta.url));
const NEO_DIR: string = path.dirname(path.dirname(HERE));
const CONFIG: string = path.join(HERE, 'biome.json');
const WARN_CONFIG: string = path.join(HERE, 'biome.warn.json');
const COGNITIVE_RULE = 'lint/complexity/noExcessiveCognitiveComplexity';
const CODE_EXTS: Set<string> = new Set(['.ts', '.mts', '.cts', '.tsx', '.js', '.mjs', '.cjs', '.jsx']);
const TYPE_EXTS: Set<string> = new Set(['.ts', '.mts', '.cts', '.tsx']);
// Split so this file never contains the banned pragmas that it scans for.
const BIOME_NEEDLE = 'biome-' + 'ignore';
const TS_IGNORE = '@ts-' + 'ignore';
const TS_EXPECT = '@ts-expect-' + 'error';
const TSC_ERROR = /^(.*?)\((\d+),\d+\):\s+error\s+(TS\d+):\s+(.*)$/;
const BIOME_TEXT_HIT = /^(.+?):(\d+):\d+\s+(lint\/[A-Za-z]+\/[A-Za-z0-9]+)/;
const COGNITIVE_HIT = /complexity of (\d+) detected/;
const LOCAL_REQUIRE: NodeRequire = createRequire(import.meta.url);

type Severity = 2 | 1;

interface RunOutput {
  code: number | string;
  out: string;
  errOut: string;
}

interface BiomeCtx {
  seen: Set<string>;
  errorAt: Set<string>;
  errors: Violation[];
  warnings: Violation[];
  cognitive: Violation[];
}

interface TierResult {
  errors: Violation[];
  warnings: Violation[];
  cognitive: Violation[];
  missing: string | null;
}

interface Measured {
  result: MetricsResult | null;
  missing: string | null;
}

interface GateCtx {
  code: string[];
  readmes: string[];
  texts: Map<string, string | null>;
  measured: Measured;
  started: number;
}

function resolveBin(packageName: string, rel: string): string | null {
  try {
    const pkgFile = LOCAL_REQUIRE.resolve(`${packageName}/package.json`);
    return path.join(path.dirname(pkgFile), rel);
  } catch {
    return null;
  }
}

function runCmd(cmd: string, args: string[], env: NodeJS.ProcessEnv, cwd?: string): Promise<RunOutput> {
  return new Promise((resolve) => {
    execFile(cmd, args, { env, cwd, maxBuffer: 32 * 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({ code: err?.code ?? 0, out: String(stdout ?? ''), errOut: String(stderr ?? '') });
    });
  });
}

function parseArgs(argv: string[]): { report: boolean; paths: string[] } {
  return {
    report: argv.includes('--report'),
    paths: argv
      .filter((a) => !a.startsWith('-'))
      .map((p) => path.resolve(p)),
  };
}

async function defaultTargets(): Promise<string[]> {
  const roots = ['src', 'tests/shared', 'tools/quality'].map((p) => path.join(NEO_DIR, p));
  try {
    const casesDir = path.join(NEO_DIR, 'tests/cases');
    for (const kid of await readdir(casesDir)) {
      const specs = path.join(casesDir, kid, 'specs');
      try { await stat(specs); roots.push(specs); } catch { /* case without specs */ }
    }
  } catch { /* no cases dir yet */ }
  return roots;
}

async function resolveTargets(paths: string[]): Promise<string[]> {
  const targets = paths.length ? paths : await defaultTargets();
  const existing: string[] = [];
  for (const t of targets) {
    try {
      await stat(t);
      existing.push(t);
    } catch {
      console.log(`[neo-quality] skipping missing path: ${t}`);
    }
  }
  return existing;
}

async function walk(entry: string, code: Set<string>, readmes: Set<string>): Promise<void> {
  let s: Stats;
  try {
    s = await stat(entry);
  } catch {
    return;
  }
  if (!s.isDirectory()) {
    const resolved = path.resolve(entry);
    if (path.basename(entry).toLowerCase() === 'readme.md') readmes.add(resolved);
    else if (CODE_EXTS.has(path.extname(entry).toLowerCase())) code.add(resolved);
    return;
  }
  const base = path.basename(entry);
  if (base === 'node_modules' || base === 'dist') return;
  for (const kid of await readdir(entry)) await walk(path.join(entry, kid), code, readmes);
}

async function collect(targets: string[]): Promise<{ code: string[]; readmes: string[] }> {
  const code = new Set<string>();
  const readmes = new Set<string>();
  for (const target of targets) await walk(target, code, readmes);
  return { code: [...code].sort(), readmes: [...readmes].sort() };
}

function isGenerated(file: string, text: string | null | undefined): boolean {
  if (file.includes('.gen.')) return true;
  return (text ?? '').split('\n', 12).some((line) => line.includes('@generated'));
}

interface BiomeJsonDiagnostic {
  location?: { path?: unknown; start?: { line?: unknown } };
  category?: unknown;
  severity?: unknown;
  message?: unknown;
}

function toViolation(d: BiomeJsonDiagnostic): Violation {
  return {
    file: typeof d.location?.path === 'string' ? d.location.path : '(unknown)',
    line: typeof d.location?.start?.line === 'number' ? d.location.start.line : 1,
    ruleId: typeof d.category === 'string' ? d.category : 'unknown',
    severity: d.severity === 'error' ? 2 : 1,
    message: typeof d.message === 'string' ? d.message : String(d.message ?? ''),
  };
}

function parseBiomeJson(out: string): Violation[] | null {
  const start = out.indexOf('{');
  if (start < 0) return null;
  try {
    const parsed = JSON.parse(out.slice(start)) as { diagnostics?: unknown };
    if (!parsed || !Array.isArray(parsed.diagnostics)) return null;
    return parsed.diagnostics.map((entry: unknown) => toViolation(entry as BiomeJsonDiagnostic));
  } catch {
    return null;
  }
}

function parseBiomeText(out: string, severity: Severity): Violation[] {
  const diags: Violation[] = [];
  for (const line of out.split('\n')) {
    const hit = line.match(BIOME_TEXT_HIT);
    if (hit) diags.push({ file: hit[1], line: Number(hit[2]), ruleId: hit[3], severity, message: `${hit[3]} (parsed from text output)` });
  }
  return diags;
}

async function biomePass(bin: string, config: string, files: string[], fallbackSeverity: Severity): Promise<{ diags: Violation[]; ok: boolean }> {
  const args = ['lint', '--config-path', config, '--max-diagnostics', 'none', '--reporter', 'json', '--vcs-enabled', 'false', '--no-errors-on-unmatched', ...files];
  // Biome 2 rejects a nested config when the invocation directory is the project root, so run
  // from neutral ground; config and targets are absolute, which makes results cwd-independent.
  const r = await runCmd(process.execPath, [bin, ...args], { ...process.env }, tmpdir());
  const json = parseBiomeJson(r.out);
  if (json) return { diags: json, ok: true };
  const text = parseBiomeText(`${r.out}\n${r.errOut}`, fallbackSeverity);
  if (text.length) return { diags: text, ok: true };
  return { diags: [], ok: false };
}

function collectBiome(m: Violation, ctx: BiomeCtx): void {
  const key = `${m.file} ${m.ruleId} ${m.line} ${m.message}`;
  if (ctx.seen.has(key)) return;
  ctx.seen.add(key);
  if (m.ruleId === COGNITIVE_RULE) ctx.cognitive.push(m);
  if (m.severity === 2) {
    ctx.errorAt.add(`${m.file} ${m.ruleId} ${m.line}`);
    ctx.errors.push(m);
  } else if (!ctx.errorAt.has(`${m.file} ${m.ruleId} ${m.line}`)) {
    ctx.warnings.push(m);
  }
}

async function biomeTier(code: string[]): Promise<TierResult> {
  if (!code.length) return { errors: [], warnings: [], cognitive: [], missing: null };
  const bin = resolveBin('@biomejs/biome', 'bin/biome');
  if (!bin) return { errors: [], warnings: [], cognitive: [], missing: 'biome' };
  const ctx: BiomeCtx = { seen: new Set(), errorAt: new Set(), errors: [], warnings: [], cognitive: [] };
  let ok = true;
  const passes: Array<[string, Severity]> = [
    [CONFIG, 2],
    [WARN_CONFIG, 1],
  ];
  for (const [config, fallback] of passes) {
    const pass = await biomePass(bin, config, code, fallback);
    if (!pass.ok) ok = false;
    for (const m of pass.diags) collectBiome(m, ctx);
  }
  return { errors: ctx.errors, warnings: ctx.warnings, cognitive: ctx.cognitive, missing: ok ? null : 'biome' };
}

type FnMetricKey = 'cyclomatic' | 'params' | 'depth' | 'lines';
const FN_TIERS: Array<[FnMetricKey, string, number, number | null]> = [
  ['cyclomatic', 'neo/cyclomatic', 12, 8],
  ['params', 'neo/params', 5, 4],
  ['depth', 'neo/depth', 4, null],
  ['lines', 'neo/function-lines', 120, 80],
];

function tierHit(value: number, fail: number, warn: number | null): Severity | 0 {
  if (value > fail) return 2;
  if (warn !== null && value > warn) return 1;
  return 0;
}

function metricsViolations(result: MetricsResult, texts: Map<string, string | null>): { errors: Violation[]; warnings: Violation[] } {
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
      ruleId: 'neo/file-lines',
      severity: sev,
      message: `neo/file-lines: ${row.lines} lines (${tierNote}).`,
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
        hits.push({ file, line: idx + 1, ruleId: 'neo/suppression', severity: 2, message: 'you-ignored-a-rule-we-set-up-dont: a suppression comment cannot land; fix the code instead.' });
      if (line.includes(TS_IGNORE))
        hits.push({ file, line: idx + 1, ruleId: 'neo/suppression', severity: 2, message: 'you-ignored-a-rule-we-set-up-dont: a ts-ignore comment cannot land; fix the types instead.' });
      if (bareExpectError(line))
        hits.push({
          file,
          line: idx + 1,
          ruleId: 'neo/suppression',
          severity: 2,
          message: 'you-ignored-a-rule-we-set-up-dont: a bare ts-expect-error cannot land; justify it on the same line (10+ chars) or fix the types.',
        });
    });
  }
  return hits;
}

function proseTier(code: string[], readmes: string[], texts: Map<string, string | null>): Violation[] {
  const errors = [...scanSuppressions(code, texts)];
  for (const f of code) {
    const v = checkHeader(f, texts.get(f));
    if (v) errors.push(v);
  }
  const casesPrefix = path.join(NEO_DIR, 'tests', 'cases') + path.sep;
  for (const f of readmes) {
    if (f.startsWith(casesPrefix)) continue; // case READMEs are never a failure: convention, not gate.
    const v = checkReadme(f, texts.get(f));
    if (v) errors.push(v);
  }
  return errors;
}

function parseTsc(out: string): Violation[] {
  const violations: Violation[] = [];
  for (const line of out.split('\n')) {
    const m = line.match(TSC_ERROR);
    if (!m) continue;
    violations.push({ file: path.resolve(m[1]), line: Number(m[2]), ruleId: 'neo/tsc', severity: 2, message: `${m[3]}: ${m[4]}` });
  }
  return violations;
}

// The type pass runs project-wide through the package tsconfig, then keeps
// only diagnostics inside the collected targets. One config stays the source
// of truth; `q [paths]` still reports just the files it was asked about.
async function tscTier(code: string[]): Promise<{ errors: Violation[]; missing: string | null }> {
  const tsFiles = code.filter((f) => TYPE_EXTS.has(path.extname(f).toLowerCase()));
  if (!tsFiles.length) return { errors: [], missing: null };
  const bin = resolveBin('typescript', 'bin/tsc');
  if (!bin) return { errors: [], missing: 'typescript' };
  const wanted = new Set(tsFiles.map((f) => path.resolve(f)));
  const r = await runCmd(process.execPath, [bin, '--noEmit', '-p', NEO_DIR], { ...process.env });
  const errors = parseTsc(`${r.out}\n${r.errOut}`).filter((v) => wanted.has(path.resolve(v.file)));
  if (r.code !== 0 && r.code !== 1) return { errors, missing: 'typescript' };
  return { errors, missing: null };
}

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

function printGroup(title: string, violations: Violation[]): void {
  console.log(`[neo-quality] ${title} (${violations.length}):`);
  for (const v of violations) {
    console.log(`  ${v.severity === 2 ? 'error' : 'warn'} ${v.file}:${v.line} ${v.ruleId ?? 'unknown'} ${v.message}`);
    const tip = tipFor(v.ruleId);
    if (tip) console.log(`    tip: ${tip}`);
  }
}

async function runReport(measured: Measured, code: string[], started: number): Promise<number> {
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

async function runGate(ctx: GateCtx): Promise<number> {
  const errors: Violation[] = [];
  const warnings: Violation[] = [];
  let missingTool = ctx.measured.missing;
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
    console.log(`[neo-quality] tooling missing: ${missingTool} is not installed; install dependencies and rerun.`);
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
  return runGate({ code, readmes, texts, measured, started });
}
