// type.spec.ts — spec for NEO-TYPE-05, the authoring-surface case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// generated declaration, the tsc diagnostic that broke the fragment, or the
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

// A fragment file against the generated system entry: config plus every D6
// authoring call. Materialized into a temp dir at spec time because it cannot
// live in the repo: the harness pre-run typecheck resolves
// @reference-ui/system to the stable surface, whose wide shapes (one-argument
// font) differ from the generated signatures.
const FRAGMENT = `import {
  baseSystem,
  defineConfig,
  font,
  getRhythm,
  globalCss,
  keyframes,
  tokens,
} from '@reference-ui/system'

export default defineConfig({ name: 'neo-type-frag', include: ['src/**/*.{js,ts,tsx}'] })

tokens({ colors: { brand: { value: '#7c3aed' } } })
font('sans', { value: 'Inter, sans-serif', weights: { bold: '700' } })
keyframes({ fade: { from: { opacity: '0' }, to: { opacity: '1' } } })
globalCss({ body: { margin: '0' } })
const one: string = getRhythm(2)
const half: string = getRhythm(1, 2)
export const probe = { one, half, baseSystem }
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
  const system = paths['@reference-ui/system'];
  assert.ok(
    Array.isArray(system) && system.some((p) => p.endsWith('system/system.d.mts')),
    `world tsconfig maps @reference-ui/system at the generated system.d.mts, got ${JSON.stringify(system)}`,
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
// into the repo, so a later pre-run typecheck never sees the fragment.
async function typecheckFragment(worldDir: string, paths: Record<string, string[]>): Promise<void> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'neo-type-05-'));
  try {
    const absolute: Record<string, string[]> = {};
    for (const [specifier, targets] of Object.entries(paths)) {
      absolute[specifier] = targets.map((target) =>
        path.isAbsolute(target) ? target : path.join(worldDir, target),
      );
    }
    fs.writeFileSync(path.join(dir, 'fragment.ts'), FRAGMENT);
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
          include: ['./fragment.ts'],
        },
        null,
        2,
      ),
    );
    const run = await runTsc(dir);
    assert.equal(
      run.code,
      0,
      `authoring fragment compiles against the generated system entry:\n${capped(run.text).join('\n')}`,
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// After sync, the generated system entry types a fragment using the full D6
// authoring surface, and the same world paints its brand probe.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const paths = readWorldTsconfig(c.worldDir);
  const outDir = path.join(c.worldDir, '.reference-ui');
  assert.ok(fs.existsSync(path.join(outDir, 'system/system.d.mts')), 'sync published system/system.d.mts');
  const systemTypes = fs.readFileSync(path.join(outDir, 'system/system.d.mts'), 'utf8');
  for (const name of ['defineConfig', 'tokens', 'font', 'keyframes', 'globalCss', 'getRhythm', 'baseSystem']) {
    assert.ok(systemTypes.includes(name), `generated system.d.mts declares ${name}`);
  }
  await typecheckFragment(c.worldDir, paths);

  const root = page.locator('#type-root');
  await root.waitFor();
  assert.equal(
    await root.evaluate((el) => getComputedStyle(el).color),
    'rgb(124, 58, 237)',
    'root paints brand text',
  );
}
