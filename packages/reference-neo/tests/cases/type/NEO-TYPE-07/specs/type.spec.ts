// type.spec.ts — spec for NEO-TYPE-07, the styled-subpaths case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// subpath declaration, the tsc diagnostic that broke a consumer, or the
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

// A consumer shaped like the landing call sites: core's Tokens/UtilityValues/
// SystemProperties/Conditions usages plus generic PrimitiveProps with Omit and
// native props. Materialized into a temp dir at spec time because it cannot
// live in the repo: the harness pre-run typecheck resolves @reference-ui/react
// to the stable surface and @reference-ui/styled to the runtime entry.
const POSITIVE = `import type { Tokens } from '@reference-ui/styled/tokens'
import type { Conditions } from '@reference-ui/styled/types/conditions'
import type { UtilityValues } from '@reference-ui/styled/types/prop-type'
import type { SystemProperties } from '@reference-ui/styled/types/style-props'
import type { PrimitiveProps, StyleProps } from '@reference-ui/react'

type ColorToken = Tokens['colors']
const color: ColorToken = 'brand'
type RadiusToken = Tokens['radii']
const radius: RadiusToken = 'md'

type PreferredKey = Extract<'backgroundColor' | 'color', keyof UtilityValues>
const preferred: PreferredKey = 'backgroundColor'

type SysKey = keyof SystemProperties
const sysKey: SysKey = 'color'

type CondKey = keyof Conditions
const condKey: CondKey = '_hover'

export type SwitchProps = Omit<PrimitiveProps<'button'>, 'onChange' | 'role' | 'type'> & {
  onChange?: (value: boolean) => void
}
const thumb: PrimitiveProps<'span'> = { color: 'brand' }
const btn: PrimitiveProps<'button'> = { type: 'button', disabled: true, color: 'ink' }
type BtnKey = keyof PrimitiveProps<'button'>
const nativeKey: BtnKey = 'onClick'
const styleKey: BtnKey = 'color'
const extraKey: BtnKey = 'css'
const modeKey: BtnKey = 'colorMode'
const variantKey: BtnKey = 'variant'
const copy: StyleProps = { color: 'ink' }

export const probe = {
  color,
  radius,
  preferred,
  sysKey,
  condKey,
  thumb,
  btn,
  nativeKey,
  styleKey,
  extraKey,
  modeKey,
  variantKey,
  copy,
}
`;

// The type argument is required: bare PrimitiveProps is TS2314, matching
// core's contract. Same temp-dir materialization as the positive file.
const NEGATIVE = `import type { PrimitiveProps } from '@reference-ui/react'

const bad: PrimitiveProps = { color: 'brand' }
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
  const subpaths = paths['@reference-ui/styled/*'];
  assert.ok(
    Array.isArray(subpaths) && subpaths.some((p) => p.endsWith('styled/*')),
    `world tsconfig maps @reference-ui/styled/* at the generated styled dir, got ${JSON.stringify(subpaths)}`,
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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'neo-type-07-'));
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

// Every subpath declaration derives from the central typegen index: the root
// and tokens modules re-export it, the types modules import from it. A grep
// over file text, not the typechecker, pins that generative discipline.
function assertDerived(outDir: string): void {
  for (const file of ['styled/index.d.ts', 'styled/tokens.d.ts']) {
    const text = fs.readFileSync(path.join(outDir, file), 'utf8');
    assert.ok(
      text.includes('./types/index.js'),
      `${file} re-exports the central typegen index`,
    );
  }
  for (const file of ['styled/types/conditions.d.ts', 'styled/types/prop-type.d.ts', 'styled/types/style-props.d.ts']) {
    const text = fs.readFileSync(path.join(outDir, file), 'utf8');
    assert.ok(text.includes('./index.js'), `${file} derives from the central typegen index`);
  }
  const reactTypes = fs.readFileSync(path.join(outDir, 'react/react.d.mts'), 'utf8');
  assert.ok(
    reactTypes.includes('PrimitiveProps<T extends PrimitiveTag>'),
    'react.d.mts declares PrimitiveProps generic over the tag',
  );
}

// After sync, the styled subpaths resolve and compile a landing-shaped
// consumer, bare PrimitiveProps is rejected, and the same world paints its
// brand probe.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const paths = readWorldTsconfig(c.worldDir);
  const outDir = path.join(c.worldDir, '.reference-ui');
  for (const file of [
    'react/react.d.mts',
    'styled/types/index.d.ts',
    'styled/index.d.ts',
    'styled/tokens.d.ts',
    'styled/types/conditions.d.ts',
    'styled/types/prop-type.d.ts',
    'styled/types/style-props.d.ts',
  ]) {
    assert.ok(fs.existsSync(path.join(outDir, file)), `sync published ${file}`);
  }
  assertDerived(outDir);

  const positive = await typecheckFile(c.worldDir, paths, 'positive.ts', POSITIVE);
  assert.equal(
    positive.code,
    0,
    `styled subpaths compile the landing-shaped consumer:\n${capped(positive.text).join('\n')}`,
  );

  const negative = await typecheckFile(c.worldDir, paths, 'negative.ts', NEGATIVE);
  assert.notEqual(negative.code, 0, 'bare PrimitiveProps is rejected without a type argument');
  assert.ok(
    negative.text.includes('TS2314'),
    `rejection carries TS2314:\n${capped(negative.text).join('\n')}`,
  );

  const root = page.locator('#type-root');
  await root.waitFor();
  assert.equal(
    await root.evaluate((el) => getComputedStyle(el).color),
    'rgb(124, 58, 237)',
    'root paints brand text',
  );
}
