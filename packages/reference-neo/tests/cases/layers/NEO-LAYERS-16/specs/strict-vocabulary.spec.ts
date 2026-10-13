// strict-vocabulary.spec.ts — spec for NEO-LAYERS-16, the layer-only vocabulary case. It takes { case }
// with the consumer world synced under strict: ['colors']. It syncs the up upstream for real, lists it
// under layers and re-syncs, then typechecks temp consumers against the generated declarations: the
// consumer's own token assigns, and the layer-only token is rejected at a JSX colour prop (TS2322) and
// at a css() argument (TS2345). It then lists the same upstream under extends as the control, where the
// token assigns. Emits nothing on success; throws naming the diagnostic that broke the expectation. The
// canonical config is restored in a finally.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import { sync } from '../../../../../src/sync/index.ts';
import {
  configPathOf,
  restoreWorld,
  syncUpstream,
  wireConfig,
  writeConfig,
  type UpstreamLink,
  type Wiring,
} from '../../shared/upstream.ts';

interface SpecInput {
  case: NeoCase;
}

interface TscRun {
  code: number | null;
  text: string;
}

interface Negative {
  label: string;
  body: string;
  code: 'TS2322' | 'TS2345';
}

const UP_TOKEN = 'upInk';
const OWN_TOKEN = 'consumerInk';
const UP_BINDING = 'upUpstream';
const UP_LINK: UpstreamLink = {
  binding: UP_BINDING,
  from: '../upstreams/up/.reference-ui/system/baseSystem.mjs',
};
const MAX_LINES = 40;
const HEADER = "import { css, Div } from '@reference-ui/react'\n\n";

// The consumer's own token on the JSX prop and the css() argument. Both must assign under layers.
const OWN_BODY = `export const own = <Div color="${OWN_TOKEN}" />\nexport const ownCss = css({ color: '${OWN_TOKEN}' })\n`;

// The layer-only token on the same two call sites, each typechecked on its own so a failure is
// attributable to the one line that carries it.
const NEGATIVES: readonly Negative[] = [
  {
    label: 'JSX color with the layer-only token',
    body: `export const bad = <Div color="${UP_TOKEN}" />\n`,
    code: 'TS2322',
  },
  {
    label: 'css() color with the layer-only token',
    body: `export const bad = css({ color: '${UP_TOKEN}' })\n`,
    code: 'TS2345',
  },
];

// The control body: the upstream token on the JSX prop, which assigns only when the token is in the
// consumer's vocabulary. It shows the layer rejection is the boundary, not a token that exists nowhere.
const CONTROL_BODY = `export const up = <Div color="${UP_TOKEN}" />\n`;

function tscBin(): string {
  // Resolve through package.json, not the bin subpath: the exports map does not expose bin/tsc.
  const pkgFile = createRequire(import.meta.url).resolve('typescript/package.json');
  return path.join(path.dirname(pkgFile), 'bin', 'tsc');
}

// The temp project sits outside the checkout with no node_modules, so react and its JSX runtime map
// to the package's own @types/react. Nothing else is remapped.
function reactTypesPaths(): Record<string, string[]> {
  const typesDir = path.dirname(createRequire(import.meta.url).resolve('@types/react/package.json'));
  return {
    react: [path.join(typesDir, 'index.d.ts')],
    'react/jsx-runtime': [path.join(typesDir, 'jsx-runtime.d.ts')],
  };
}

// The consumer sees only the generated declarations of the synced world, so the strict narrowing
// in those declarations is what each typecheck measures.
function generatedPaths(worldDir: string): Record<string, string[]> {
  const outDir = path.join(worldDir, '.reference-ui');
  return {
    '@reference-ui/react': [path.join(outDir, 'react', 'react.d.mts')],
    '@reference-ui/styled': [path.join(outDir, 'styled', 'types', 'index.d.ts')],
    ...reactTypesPaths(),
  };
}

function runTsc(cwd: string): Promise<TscRun> {
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

// Writes one consumer into a temp project, typechecks it and removes the project. The consumer never
// lands in the repo, so the pre-run typecheck of the package never sees it.
async function typecheck(worldDir: string, body: string): Promise<TscRun> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'neo-layers-16-'));
  try {
    fs.writeFileSync(path.join(dir, 'consumer.tsx'), HEADER + body);
    const tsconfig = {
      compilerOptions: {
        strict: true,
        noEmit: true,
        jsx: 'react-jsx',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        target: 'ES2022',
        lib: ['ES2022', 'DOM'],
        skipLibCheck: false,
        paths: generatedPaths(worldDir),
      },
      include: ['./consumer.tsx'],
    };
    fs.writeFileSync(path.join(dir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));
    return await runTsc(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// The first diagnostic lines, capped, so a failure message stays readable.
function capped(text: string): string {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return 'tsc failed with no diagnostics';
  const shown = lines.slice(0, MAX_LINES);
  if (lines.length > MAX_LINES) shown.push(`... and ${lines.length - MAX_LINES} more diagnostics`);
  return shown.join('\n');
}

// The generated types wrap the style props in StrictColorProps, and the layer-only token appears
// as a colour literal only when the upstream is listed under extends.
function assertVocabulary(worldDir: string, inVocabulary: boolean): void {
  const types = fs.readFileSync(
    path.join(worldDir, '.reference-ui', 'styled', 'types', 'index.d.ts'),
    'utf8',
  );
  assert.ok(
    types.includes('StrictColorProps<BaseStyleProps>'),
    'strict colours wrap the style props: styled types carry StrictColorProps<BaseStyleProps>',
  );
  const literal = new RegExp(`['"]${UP_TOKEN}['"]`);
  assert.equal(
    literal.test(types),
    inVocabulary,
    `generated types ${inVocabulary ? 'carry' : 'carry no'} the ${UP_TOKEN} colour literal under this wiring`,
  );
}

// Under layers the consumer's own token assigns, and the layer-only token is rejected at each call
// site with its own TS code, naming the token in the diagnostic.
async function assertLayersVocabulary(worldDir: string): Promise<void> {
  const own = await typecheck(worldDir, OWN_BODY);
  assert.equal(
    own.code,
    0,
    `the consumer's own ${OWN_TOKEN} assigns under layers:\n${capped(own.text)}`,
  );
  for (const negative of NEGATIVES) {
    const result = await typecheck(worldDir, negative.body);
    assert.notEqual(result.code, 0, `${negative.label} is rejected under layers`);
    const code = new RegExp(`consumer\\.tsx\\(\\d+,\\d+\\): error ${negative.code}\\b`);
    assert.match(
      result.text,
      code,
      `${negative.label} is a ${negative.code} at the consumer line:\n${capped(result.text)}`,
    );
    assert.ok(
      result.text.includes(`Type '"${UP_TOKEN}"' is not assignable`),
      `${negative.label} names "${UP_TOKEN}":\n${capped(result.text)}`,
    );
  }
}

// Under extends the same token is in the vocabulary, so the JSX prop assigns.
async function assertExtendsControl(worldDir: string): Promise<void> {
  const control = await typecheck(worldDir, CONTROL_BODY);
  assert.equal(
    control.code,
    0,
    `control: under extends the ${UP_TOKEN} token assigns at the JSX colour prop:\n${capped(control.text)}`,
  );
}

// The consumer lists the up upstream by relative import, under extends or under layers.
function wiringFor(bucket: 'extends' | 'layers'): Wiring {
  return bucket === 'extends'
    ? { links: [UP_LINK], extends: [UP_BINDING], layers: [] }
    : { links: [UP_LINK], extends: [], layers: [UP_BINDING] };
}

// Syncs the upstream for real, lists it under layers and checks the typed vocabulary, then lists it
// under extends as the control. Restores the canonical config and re-syncs in the finally.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const canonical = fs.readFileSync(configPathOf(c.worldDir), 'utf8');
  await syncUpstream(path.join(c.dir, 'upstreams', 'up'));
  try {
    writeConfig(c.worldDir, wireConfig(canonical, wiringFor('layers')));
    const layered = await sync(c.worldDir);
    assert.ok(
      !layered.diagnostics.some((d) => d.severity === 'error'),
      'the layers sync reports no error diagnostics',
    );
    assertVocabulary(c.worldDir, false);
    await assertLayersVocabulary(c.worldDir);

    writeConfig(c.worldDir, wireConfig(canonical, wiringFor('extends')));
    const extended = await sync(c.worldDir);
    assert.ok(
      !extended.diagnostics.some((d) => d.severity === 'error'),
      'the extends sync reports no error diagnostics',
    );
    assertVocabulary(c.worldDir, true);
    await assertExtendsControl(c.worldDir);
  } finally {
    await restoreWorld(c.worldDir, canonical);
  }
}
