// typecheck.ts — shared temp-project tsc harness for the PGEN type specs. Takes a
// world dir plus in-memory consumer sources and emits pass/fail verdicts with
// capped diagnostics. Worlds commit only the paths map; every consumer is
// materialized into a temp dir at spec time so the harness pre-run typecheck,
// which resolves @reference-ui/react to the stable surface, never sees them.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

const MAX_LINES = 40;

interface WorldTsconfig {
  compilerOptions?: Record<string, unknown>;
}

// The committed world tsconfig is the single source of truth for the
// mapping: @pgen/primitives at the vendored E4 plus @reference-ui/styled at
// the world's synced types, which carry E4's narrowing (ColorToken and kin).
export function readPgenWorldTsconfig(worldDir: string): Record<string, string[]> {
  const raw = fs.readFileSync(path.join(worldDir, 'tsconfig.json'), 'utf8');
  const parsed = JSON.parse(raw) as WorldTsconfig;
  const compilerOptions = parsed.compilerOptions ?? {};
  const paths = compilerOptions['paths'] as Record<string, string[]> | undefined;
  assert.ok(paths && typeof paths === 'object', 'world tsconfig.json carries a paths map');
  const pgen = paths['@pgen/primitives'];
  assert.ok(
    Array.isArray(pgen) && pgen.some((p) => p.endsWith('native/generated/primitives/primitives.d.ts')),
    `world tsconfig maps @pgen/primitives at the vendored E4, got ${JSON.stringify(pgen)}`,
  );
  const styled = paths['@reference-ui/styled'];
  assert.ok(
    Array.isArray(styled) && styled.some((p) => p.endsWith('styled/types/index.d.ts')),
    `world tsconfig maps @reference-ui/styled at the synced styled types, got ${JSON.stringify(styled)}`,
  );
  return paths;
}

function resolvePackageFile(specifier: string, file: string): string {
  const pkgFile = createRequire(import.meta.url).resolve(`${specifier}/package.json`);
  return path.join(pkgFile, '..', file);
}

function tscBin(): string {
  // Resolve through package.json, not the bin subpath: the exports map
  // does not expose bin/tsc directly (same approach as the shared gate).
  return resolvePackageFile('typescript', path.join('bin', 'tsc'));
}

export interface TscResult {
  code: number | null;
  text: string;
}

function runTsc(cwd: string): Promise<TscResult> {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [tscBin(), '--noEmit', '-p', cwd],
      { timeout: 180000 },
      (err, stdout, stderr) => {
        if (err && (err.killed || (err as { code?: unknown }).code === 'ETIMEDOUT')) {
          resolve({ code: null, text: 'tsc timed out after 180s' });
          return;
        }
        resolve({ code: err ? ((err as { code?: number }).code ?? 1) : 0, text: `${stdout}\n${stderr}` });
      },
    );
  });
}

export function capped(text: string): string[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) lines.push('tsc failed with no diagnostics');
  const shown = lines.slice(0, MAX_LINES);
  if (lines.length > MAX_LINES) shown.push(`... and ${lines.length - MAX_LINES} more diagnostics`);
  return shown;
}

// One temp project per consumer: world paths rewritten absolute (a temp dir
// outside the checkout cannot resolve them relatively) plus react shims for
// consumers importing React types. Nothing is written into the repo.
export interface TypecheckRequest {
  tag: string;
  worldDir: string;
  paths: Record<string, string[]>;
  file: string;
  source: string;
}

export async function typecheckFile(request: TypecheckRequest): Promise<TscResult> {
  const { tag, worldDir, paths, file, source } = request;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `neo-${tag}-`));
  try {
    const absolute: Record<string, string[]> = {};
    for (const [specifier, targets] of Object.entries(paths)) {
      absolute[specifier] = targets.map((target) =>
        path.isAbsolute(target) ? target : path.join(worldDir, target),
      );
    }
    const typesReact = path.dirname(createRequire(import.meta.url).resolve('@types/react/package.json'));
    absolute['react'] = [path.join(typesReact, 'index.d.ts')];
    absolute['react/jsx-runtime'] = [path.join(typesReact, 'jsx-runtime.d.ts')];
    fs.writeFileSync(path.join(dir, file), source);
    fs.writeFileSync(
      path.join(dir, 'tsconfig.json'),
      JSON.stringify(
        {
          compilerOptions: {
            strict: true,
            noEmit: true,
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            target: 'ES2022',
            lib: ['ES2022', 'DOM'],
            skipLibCheck: false,
            paths: absolute,
          },
          include: [`./${file}`],
        },
        null,
        2,
      ),
    );
    return await runTsc(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
