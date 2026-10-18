/**
 * The external tool tiers of the Core quality gate: the two Biome passes (strict and warn-only) and the strict tsc
 * project pass. Each runner shells out, maps the tool's diagnostics onto Violation records, and reports a missing or
 * killed tool as a tooling failure rather than as a clean run.
 */
import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execExitCode } from '../../tests/shared/exit-code.ts';
import type { Violation } from './prose.ts';
import { CORE_DIR } from './walk.ts';

const HERE: string = path.dirname(fileURLToPath(import.meta.url));
const CONFIG: string = path.join(HERE, 'biome.json');
const WARN_CONFIG: string = path.join(HERE, 'biome.warn.json');
const COGNITIVE_RULE = 'lint/complexity/noExcessiveCognitiveComplexity';
const TYPE_EXTS: Set<string> = new Set(['.ts', '.mts', '.cts', '.tsx']);
const TSC_ERROR = /^(.*?)\((\d+),\d+\):\s+error\s+(TS\d+):\s+(.*)$/;
const BIOME_TEXT_HIT = /^(.+?):(\d+):\d+\s+(lint\/[A-Za-z]+\/[A-Za-z0-9]+)/;
const LOCAL_REQUIRE: NodeRequire = createRequire(import.meta.url);

export type Severity = 2 | 1;

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

export interface TierResult {
  errors: Violation[];
  warnings: Violation[];
  cognitive: Violation[];
  missing: string | null;
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
      resolve({ code: execExitCode(err), out: String(stdout ?? ''), errOut: String(stderr ?? '') });
    });
  });
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

export async function biomeTier(code: string[]): Promise<TierResult> {
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

function parseTsc(out: string): Violation[] {
  const violations: Violation[] = [];
  for (const line of out.split('\n')) {
    const m = line.match(TSC_ERROR);
    if (!m) continue;
    violations.push({ file: path.resolve(m[1]), line: Number(m[2]), ruleId: 'core/tsc', severity: 2, message: `${m[3]}: ${m[4]}` });
  }
  return violations;
}

// The type pass runs project-wide through the package tsconfig, then keeps
// only diagnostics inside the collected targets. One config stays the source
// of truth; `q [paths]` still reports just the files it was asked about.
export async function tscTier(code: string[]): Promise<{ errors: Violation[]; missing: string | null }> {
  const tsFiles = code.filter((f) => TYPE_EXTS.has(path.extname(f).toLowerCase()));
  if (!tsFiles.length) return { errors: [], missing: null };
  const bin = resolveBin('typescript', 'bin/tsc');
  if (!bin) return { errors: [], missing: 'typescript' };
  const wanted = new Set(tsFiles.map((f) => path.resolve(f)));
  const r = await runCmd(process.execPath, [bin, '--noEmit', '-p', CORE_DIR], { ...process.env });
  const errors = parseTsc(`${r.out}\n${r.errOut}`).filter((v) => wanted.has(path.resolve(v.file)));
  if (r.code !== 0 && r.code !== 1) return { errors, missing: 'typescript' };
  return { errors, missing: null };
}
