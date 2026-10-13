// token-names.spec.ts — spec for NEO-LAYERS-07, the layer token-name case. Takes { page, url, case }
// with the consumer world synced standalone. It syncs the up upstream for real and wires it under
// layers: each token-backed use warns once at its line in world/src/app.tsx, the consumer's rules
// print the raw names, and no probe paints a layer value. It then wires the same upstream under
// extends, checks the unknown-token warnings are gone, and checks the upstream values paint. The
// canonical config is restored in a finally. Emits nothing on success; throws naming the failed
// assertion on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync, type SyncResult } from '../../../../../src/sync/index.ts';
import {
  blockSpan,
  configPathOf,
  readSheet,
  restoreWorld,
  syncUpstream,
  wireConfig,
  writeConfig,
  type BlockSpan,
  type Wiring,
} from '../../shared/upstream.ts';

interface SpecInput {
  page: SpecPage;
  url: string;
  case: NeoCase;
}

// The computed properties the probes read, one per token category the consumer names.
interface Paint {
  color: string;
  padding: string;
  borderRadius: string;
  fontFamily: string;
  fontSize: string;
}

type PaintProp = keyof Paint;

// One use of a token name in app.tsx. A null code means the category is not warned: font families stay raw and silent.
interface Probe {
  id: string;
  token: string;
  prop: PaintProp;
  code: string | null;
}

type Diagnostics = SyncResult['diagnostics'];

const UP = 'neo-layers7-up';
const OWN = 'neo-layers7';
const STATEMENT = `@layer ${UP}, ${OWN};`;
const COLOR_WARNING = 'ATM-W-UNKNOWN-COLOR';
const TOKEN_WARNING = 'ATM-W-UNKNOWN-TOKEN';
const APP_FILE = path.join('src', 'app.tsx');
const UP_LINK = { binding: 'upUpstream', from: '../upstreams/up/.reference-ui/system/baseSystem.mjs' };

const PROBES: readonly Probe[] = [
  { id: 'jsx-color', token: 'upInk', prop: 'color', code: COLOR_WARNING },
  { id: 'jsx-gap', token: 'upGap', prop: 'padding', code: TOKEN_WARNING },
  { id: 'jsx-radius', token: 'upRadius', prop: 'borderRadius', code: TOKEN_WARNING },
  { id: 'jsx-font', token: 'upFont', prop: 'fontFamily', code: null },
  { id: 'jsx-size', token: 'upSize', prop: 'fontSize', code: TOKEN_WARNING },
  { id: 'css-color', token: 'upInk', prop: 'color', code: COLOR_WARNING },
  { id: 'css-gap', token: 'upGap', prop: 'padding', code: TOKEN_WARNING },
  { id: 'css-radius', token: 'upRadius', prop: 'borderRadius', code: TOKEN_WARNING },
  { id: 'css-font', token: 'upFont', prop: 'fontFamily', code: null },
  { id: 'css-size', token: 'upSize', prop: 'fontSize', code: TOKEN_WARNING },
];

// What the upstream's tokens paint once the consumer resolves the same names under extends.
const UP_VALUE: Paint = {
  color: 'rgb(190, 24, 93)',
  padding: '13px',
  borderRadius: '9px',
  fontFamily: 'Georgia, serif',
  fontSize: '21px',
};

// Under layers the font family is not resolved: the browser keeps the bare name it was given.
const RAW_FAMILY = 'upFont';

// Rule texts the consumer's own block prints under layers: each name raw, never resolved.
const RAW_DECLARATIONS = [
  'color: upInk;',
  'padding: upGap;',
  'border-radius: upRadius;',
  'font-size: upSize;',
  'font-family: upFont;',
];

// The upstream's own rules and token declarations; they resolve inside the layer's block.
const UP_RULES = [
  `.${UP}__c_upInk { color: var(--colors-up-ink); }`,
  `.${UP}__upBadge__base { color: var(--colors-up-ink); }`,
  '--colors-up-ink: #be185d;',
  '--spacing-up-gap: 13px;',
  '--radii-up-radius: 9px;',
  '--fonts-up-font: Georgia, serif;',
  '--font-sizes-up-size: 21px;',
];

const UP_VARS = [
  '--colors-up-ink',
  '--spacing-up-gap',
  '--radii-up-radius',
  '--fonts-up-font',
  '--font-sizes-up-size',
];

function wiringFor(bucket: 'extends' | 'layers'): Wiring {
  if (bucket === 'layers') return { links: [UP_LINK], extends: [], layers: ['upUpstream'] };
  return { links: [UP_LINK], extends: ['upUpstream'], layers: [] };
}

// The line of a probe's use in app.tsx: the sync warning must point at it, 1-based.
function useLineOf(app: string[], id: string): number {
  const at = app.findIndex((line) => line.includes(`id="${id}"`));
  if (at < 0) throw new Error(`world/src/app.tsx lost the probe ${id}`);
  return at + 1;
}

// One probe's warning under layers: exactly one at its use site, or none for a font family.
function assertProbeWarning(diagnostics: Diagnostics, probe: Probe, app: string[]): void {
  if (probe.code === null) {
    assert.ok(
      !diagnostics.some((d) => d.message.includes(probe.token)),
      `${probe.token} is a font family: no warning names it`,
    );
    return;
  }
  const line = useLineOf(app, probe.id);
  const hits = diagnostics.filter(
    (d) => d.code === probe.code && d.message.includes(probe.token) && d.line === line,
  );
  assert.equal(
    hits.length,
    1,
    `${probe.id}: one ${probe.code} names ${probe.token} at app.tsx line ${line}, got ${hits.length}`,
  );
  assert.ok(hits[0].file?.endsWith(APP_FILE), `${probe.id}: the warning sits in app.tsx, got ${hits[0].file}`);
}

// Under layers every token-backed use warns exactly once and no error is raised.
function assertLayerWarnings(result: SyncResult, worldDir: string): void {
  assert.ok(!result.diagnostics.some((d) => d.severity === 'error'), 'the layer-only tokens are not sync errors');
  const app = fs.readFileSync(path.join(worldDir, 'src', 'app.tsx'), 'utf8').split('\n');
  const warned = result.diagnostics.filter((d) => d.code === COLOR_WARNING || d.code === TOKEN_WARNING);
  const expected = PROBES.filter((p) => p.code !== null).length;
  assert.equal(warned.length, expected, `one warning per token-backed use, got ${warned.length}`);
  for (const probe of PROBES) assertProbeWarning(result.diagnostics, probe, app);
}

// The text of one span of the served sheet, from its block opener to the span's end.
function within(styles: string, span: BlockSpan): string {
  return styles.slice(span.from, span.to);
}

// The upstream block prints its own resolved rules and token declarations, the own block prints each raw name.
function assertLayerSheet(styles: string): void {
  assert.ok(styles.split('\n').includes(STATEMENT), `served sheet carries ${STATEMENT}`);
  const up = blockSpan(styles, UP, OWN);
  const own = blockSpan(styles, OWN);
  assert.ok(up.from >= 0 && up.from < up.to && up.to <= own.from, 'the upstream block precedes the own block');
  const upBlock = within(styles, up);
  for (const rule of UP_RULES) {
    assert.ok(upBlock.includes(rule), `the upstream block carries ${rule}`);
  }
  const ownBlock = within(styles, { from: own.from, to: styles.length });
  for (const decl of RAW_DECLARATIONS) {
    assert.ok(ownBlock.includes(decl), `the own block prints ${decl} raw`);
  }
  for (const variable of UP_VARS) {
    assert.ok(!ownBlock.includes(`var(${variable})`), `the own block never resolves ${variable}`);
  }
}

// Under extends the same names resolve: no raw declaration survives, and the consumer adopts the token.
function assertExtendsSheet(styles: string): void {
  for (const decl of RAW_DECLARATIONS) {
    assert.ok(!styles.includes(decl), `extends resolves the name: no raw ${decl}`);
  }
  assert.ok(styles.includes('--colors-up-ink: #be185d;'), 'extends adopts the token variable in the consumer sheet');
}

// Under extends the sync raises no unknown-token warning and no error.
function assertNoUnknownToken(result: SyncResult): void {
  assert.ok(!result.diagnostics.some((d) => d.severity === 'error'), 'the extends sync raises no error');
  const left = result.diagnostics.filter((d) => d.code === COLOR_WARNING || d.code === TOKEN_WARNING);
  assert.deepEqual(
    left.map((d) => d.message),
    [],
    'extends resolves every token name with no unknown-token warning',
  );
}

// One DOM read of a probe's computed style for the five properties the probes set.
async function readPaint(page: SpecPage, id: string): Promise<Paint> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  return node.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      color: style.color,
      padding: style.padding,
      borderRadius: style.borderRadius,
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
    };
  });
}

// Under layers each probe paints what the unstyled sibling paints; the font family keeps its raw name.
async function assertLayerPaints(page: SpecPage): Promise<void> {
  const plain = await readPaint(page, 'plain');
  for (const probe of PROBES) {
    const paint = await readPaint(page, probe.id);
    const expected = probe.prop === 'fontFamily' ? RAW_FAMILY : plain[probe.prop];
    assert.equal(paint[probe.prop], expected, `${probe.id} paints no layer value for ${probe.prop}`);
  }
}

// Under extends each probe paints the upstream value of the token it names.
async function assertExtendsPaints(page: SpecPage): Promise<void> {
  for (const probe of PROBES) {
    const paint = await readPaint(page, probe.id);
    assert.equal(paint[probe.prop], UP_VALUE[probe.prop], `${probe.id} paints the upstream ${probe.token} as ${probe.prop}`);
  }
}

// Syncs the upstream for real, runs the consumer under layers and then under extends with the config
// rewritten between them, and restores the canonical spelling in a finally.
export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  const canonical = fs.readFileSync(configPathOf(c.worldDir), 'utf8');
  const published = await syncUpstream(path.join(c.dir, 'upstreams', 'up'));
  assert.equal(published.name, UP, `upstream publishes its name, got ${published.name}`);
  try {
    writeConfig(c.worldDir, wireConfig(canonical, wiringFor('layers')));
    const layered = await sync(c.worldDir);
    assertLayerWarnings(layered, c.worldDir);
    assertLayerSheet(readSheet(c.worldDir));
    await page.goto(`${url}?phase=layers`, { waitUntil: 'load' });
    await assertLayerPaints(page);

    writeConfig(c.worldDir, wireConfig(canonical, wiringFor('extends')));
    const extended = await sync(c.worldDir);
    assertNoUnknownToken(extended);
    assertExtendsSheet(readSheet(c.worldDir));
    await page.goto(`${url}?phase=extends`, { waitUntil: 'load' });
    await assertExtendsPaints(page);
  } finally {
    await restoreWorld(c.worldDir, canonical);
  }
}
