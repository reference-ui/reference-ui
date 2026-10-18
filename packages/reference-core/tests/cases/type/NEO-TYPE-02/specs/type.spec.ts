// type.spec.ts — spec for NEO-TYPE-02, the token-union case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// generated declaration, the tsc diagnostic that broke a consumer, or the
// unpainted probe on failure.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

const MAX_LINES = 40;

// A known literal assigns at a ColorToken-typed position, and default-open
// StyleProps keep the (string & {}) hatch. Materialized into a temp dir at
// spec time because it cannot live in the repo: the harness pre-run
// typecheck resolves @reference-ui/react to the stable surface.
const POSITIVE = `import type { ColorToken, StyleProps } from '@reference-ui/react'

const known: ColorToken = 'brand'
const open: StyleProps = { color: 'anything-at-all' }
export const probe = { known, open }
`;

// 'nope' is not a declared color token, so the ColorToken position rejects it
// with TS2322. Same temp-dir materialization as the positive file.
const NEGATIVE = `import type { ColorToken } from '@reference-ui/react'

const bad: ColorToken = 'nope'
export { bad }
`;

interface WorldTsconfig {
  compilerOptions?: Record<string, unknown>;
}

function readWorldTsconfig(worldDir: string): Record<string, string[]> {
  const raw = fs.readFileSync(path.join(worldDir, 'tsconfig.json'), 'utf8');
  const parsed = JSON.parse(raw) as WorldTsconfig;
  const compilerOptions = parsed.compilerOptions ?? {};
  const paths = compilerOptions['paths'] as Record<string, string[]> | undefined;
  assert.ok(paths && typeof paths === 'object', 'world tsconfig.json carries a paths map');
  const react = paths['@reference-ui/react'];
  assert.ok(
    Array.isArray(react) && react.some((p) => p.endsWith('react/react.d.mts')),
    `world tsconfig maps @reference-ui/react at the generated react.d.mts, got ${JSON.stringify(react)}`,
  );
  const styled = paths['@reference-ui/styled'];
  assert.ok(
    Array.isArray(styled) && styled.some((p) => p.endsWith('styled/types/index.d.ts')),
    `world tsconfig maps @reference-ui/styled at the generated styled types, got ${JSON.stringify(styled)}`,
  );
  return paths;
}

function resolvePackageFile(specifier: string, file: string): string {
  const pkgFile = createRequire(import.meta.url).resolve(`${specifier}/package.json`);
  return path.join(path.dirname(pkgFile), file);
}

function tscBin(): string {
  // Resolve through package.json, not the bin subpath: the exports map
  // does not expose bin/tsc directly (same approach as the shared gate).
  return resolvePackageFile('typescript', path.join('bin', 'tsc'));
}

function runTsc(cwd: string): Promise<{ code: number | null; text: string }> {
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

function capped(text: string): string[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) lines.push('tsc failed with no diagnostics');
  const shown = lines.slice(0, MAX_LINES);
  if (lines.length > MAX_LINES) shown.push(`... and ${lines.length - MAX_LINES} more diagnostics`);
  return shown;
}

// The committed world/tsconfig.json is the single source of truth for the
// mapping; the temp project reuses its paths rewritten absolute (a temp dir
// outside the checkout cannot resolve them relatively). Nothing is written
// into the repo, so a later pre-run typecheck never sees the consumers.
async function typecheckFile(
  worldDir: string,
  paths: Record<string, string[]>,
  file: string,
  source: string,
): Promise<{ code: number | null; text: string }> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'neo-type-02-'));
  try {
    const absolute: Record<string, string[]> = {};
    for (const [specifier, targets] of Object.entries(paths)) {
      absolute[specifier] = targets.map((target) =>
        path.isAbsolute(target) ? target : path.join(worldDir, target),
      );
    }
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

// After sync, the generated declarations accept a known token literal at a
// ColorToken position and keep the open StyleProps hatch, reject an unknown
// literal with TS2322, and the same world paints its brand probe.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const paths = readWorldTsconfig(c.worldDir);
  const outDir = path.join(c.worldDir, '.reference-ui');
  for (const file of ['react/react.d.mts', 'styled/types/index.d.ts']) {
    assert.ok(fs.existsSync(path.join(outDir, file)), `sync published ${file}`);
  }

  const positive = await typecheckFile(c.worldDir, paths, 'positive.ts', POSITIVE);
  assert.equal(
    positive.code,
    0,
    `known token literal assigns at a ColorToken position:\n${capped(positive.text).join('\n')}`,
  );

  const negative = await typecheckFile(c.worldDir, paths, 'negative.ts', NEGATIVE);
  assert.notEqual(negative.code, 0, 'unknown token literal is rejected at a ColorToken position');
  assert.ok(
    negative.text.includes('TS2322'),
    `rejection carries TS2322:\n${capped(negative.text).join('\n')}`,
  );

  const root = page.locator('#type-root');
  await root.waitFor();
  assert.equal(
    await root.evaluate((el) => getComputedStyle(el).color),
    'rgb(124, 58, 237)',
    'root paints brand text',
  );
}
