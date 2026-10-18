// layered-upstream.spec.ts — spec for NEO-LAYERS-01, the layered-upstream case.
// Takes { page, url, case } with the consumer world synced standalone. It syncs
// the ext and lay upstream packages for real, wires them into the consumer config
// as extends and layers, and re-syncs. Emits nothing on success; throws naming
// the failed assertion on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync } from '../../../../../src/sync/index.ts';

interface SpecInput {
  page: SpecPage;
  url: string;
  case: NeoCase;
}

interface PublishedStream {
  name: string;
  utilities?: string;
}

interface PublishedBaseSystem {
  name: string;
  streams?: PublishedStream[];
}

const EXT = 'neo-layers1-ext';
const LAY = 'neo-layers1-lay';
const OWN = 'neo-layers1';
const STATEMENT = `@layer ${EXT}, ${LAY}, ${OWN};`;

// Paths from the world to each upstream's published base system.
const EXT_BASE = '../upstreams/ext/.reference-ui/system/baseSystem.mjs';
const LAY_BASE = '../upstreams/lay/.reference-ui/system/baseSystem.mjs';

// Class names the upstream syncs emit (asserted against their output below).
// index.html carries the upstream names as static markup; the own name is the
// runtime css() class that app.ts appends to the rank probe.
const EXT_INK = `${EXT}__c_extInk`;
const LAY_INK = `${LAY}__c_layInk`;
const LAY_PAPER = `${LAY}__bg-c_layPaper`;
const OWN_INK_SELECTOR = 'neo-layers1__c_\\#15803d';

// Computed colours of the upstream tokens: rgb() of #1d4ed8, #be185d, #ccfbf1, #15803d.
const EXT_RGB = 'rgb(29, 78, 216)';
const LAY_INK_RGB = 'rgb(190, 24, 93)';
const LAY_PAPER_RGB = 'rgb(204, 251, 241)';
const OWN_RGB = 'rgb(21, 128, 61)';

function readPublishedBaseSystem(outDir: string): PublishedBaseSystem {
  const raw = fs.readFileSync(path.join(outDir, 'system', 'baseSystem.mjs'), 'utf8');
  return JSON.parse(raw.slice(raw.indexOf('{'))) as PublishedBaseSystem;
}

// The probes are valid only while the upstream sync emits exactly these rules.
function assertEmits(system: PublishedBaseSystem, rule: string): void {
  const utilities = (system.streams ?? []).map((s) => s.utilities ?? '').join('\n');
  assert.ok(utilities.includes(rule), `${system.name} sync emits ${rule}`);
}

// Extends the canonical config with the ext entry and the layers entry. The
// canonical spelling is restored in the spec's finally.
function toLayeredConfig(canonical: string): string {
  const withImports = canonical.replace(
    "import { defineConfig } from '@reference-ui/neo'",
    [
      "import { defineConfig } from '@reference-ui/neo'",
      `import { baseSystem as extUpstream } from '${EXT_BASE}'`,
      `import { baseSystem as layUpstream } from '${LAY_BASE}'`,
    ].join('\n'),
  );
  if (withImports === canonical) {
    throw new Error('canonical ui.config lost its neo import');
  }
  const layered = withImports.replace(
    'extends: [],',
    'extends: [extUpstream],\n  layers: [layUpstream],',
  );
  if (layered === withImports) {
    throw new Error('canonical ui.config lost its empty extends');
  }
  return layered;
}

// A block's span in the sheet: the offset where its opening line starts, and the
// offset where the next block starts (or the end of the sheet).
interface BlockSpan {
  from: number;
  to: number;
}

function assertRuleIn(styles: string, rule: string, span: BlockSpan, what: string): void {
  const at = styles.indexOf(rule);
  assert.ok(
    at > span.from && at < span.to,
    `${what} carries ${rule} (at ${at}, block ${span.from}..${span.to})`,
  );
}

// The served sheet opens with the statement, then the ext block, the lay block and
// the own block, and each probe rule lands inside its own block's span.
function assertSheetOrder(styles: string): void {
  const statement = styles.indexOf(STATEMENT);
  const ext = styles.indexOf(`@layer ${EXT} {`);
  const lay = styles.indexOf(`@layer ${LAY} {`);
  const own = styles.indexOf(`@layer ${OWN} {`);
  assert.ok(statement >= 0, `served sheet carries the statement ${STATEMENT}`);
  const order = [statement, ext, lay, own].join(' ');
  assert.ok(
    statement < ext && ext < lay && lay < own,
    `blocks follow the statement in extends, layers, own order (${order})`,
  );
  assertRuleIn(styles, `.${EXT_INK} {`, { from: ext, to: lay }, 'extends block');
  assertRuleIn(styles, `.${LAY_INK} {`, { from: lay, to: own }, 'layers block');
  assertRuleIn(styles, `.${LAY_PAPER} {`, { from: lay, to: own }, 'layers block');
  assertRuleIn(
    styles,
    `.${OWN_INK_SELECTOR} {`,
    { from: own, to: styles.length },
    'own block',
  );
}

async function colorOf(page: SpecPage, id: string): Promise<string> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  return node.evaluate((el) => getComputedStyle(el).color);
}

async function backgroundOf(page: SpecPage, id: string): Promise<string> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  return node.evaluate((el) => getComputedStyle(el).backgroundColor);
}

async function assertPaints(page: SpecPage): Promise<void> {
  const ext = await colorOf(page, 'extends-only');
  assert.equal(ext, EXT_RGB, `extends utility paints its token, got ${ext}`);
  const ink = await colorOf(page, 'layer-ink');
  assert.equal(ink, LAY_INK_RGB, `layers utility paints its token, got ${ink}`);
  const paper = await backgroundOf(page, 'layer-paper');
  assert.equal(paper, LAY_PAPER_RGB, `layers background paints its token, got ${paper}`);
}

async function assertRanks(page: SpecPage): Promise<void> {
  const layerOverExt = await colorOf(page, 'rank-extends-layer');
  assert.equal(
    layerOverExt,
    LAY_INK_RGB,
    `layers outrank extends on one property, got ${layerOverExt}`,
  );
  const ownOverLayer = await colorOf(page, 'rank-layer-own');
  assert.equal(
    ownOverLayer,
    OWN_RGB,
    `own css() outranks layers on one property, got ${ownOverLayer}`,
  );
}

async function assertTokenScope(page: SpecPage): Promise<void> {
  const scoped = await page.locator('#token-scoped').evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      ink: style.getPropertyValue('--colors-lay-ink').trim(),
      paper: style.getPropertyValue('--colors-lay-paper').trim(),
    };
  });
  assert.deepEqual(
    scoped,
    { ink: '#be185d', paper: '#ccfbf1' },
    'layers tokens resolve in their data-layer scope',
  );
  const unscoped = await page
    .locator('#token-unscoped')
    .evaluate((el) => getComputedStyle(el).getPropertyValue('--colors-lay-ink').trim());
  assert.equal(unscoped, '', 'layers tokens do not hoist outside their data-layer scope');
}

// Syncs both upstreams for real, checks the rules the probes need, then rewrites the
// consumer config, re-syncs, and asserts the sheet order and the computed paints.
export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  const configPath = path.join(c.worldDir, 'ui.config.ts');
  const canonical = fs.readFileSync(configPath, 'utf8');
  const upstreams = path.join(c.dir, 'upstreams');

  await sync(path.join(upstreams, 'ext'));
  await sync(path.join(upstreams, 'lay'));
  const ext = readPublishedBaseSystem(path.join(upstreams, 'ext', '.reference-ui'));
  const lay = readPublishedBaseSystem(path.join(upstreams, 'lay', '.reference-ui'));
  assert.equal(ext.name, EXT, `extends upstream publishes its name, got ${ext.name}`);
  assert.equal(lay.name, LAY, `layers upstream publishes its name, got ${lay.name}`);
  assertEmits(ext, `.${EXT_INK} { color: var(--colors-ext-ink); }`);
  assertEmits(lay, `.${LAY_INK} { color: var(--colors-lay-ink); }`);
  assertEmits(lay, `.${LAY_PAPER} { background-color: var(--colors-lay-paper); }`);

  fs.writeFileSync(configPath, toLayeredConfig(canonical), 'utf8');
  try {
    await sync(c.worldDir);
    const styles = fs.readFileSync(
      path.join(c.worldDir, '.reference-ui', 'styled', 'styles.css'),
      'utf8',
    );
    assertSheetOrder(styles);
    await page.goto(`${url}?layers=1`, { waitUntil: 'load' });
    await assertPaints(page);
    await assertRanks(page);
    await assertTokenScope(page);
  } finally {
    fs.writeFileSync(configPath, canonical, 'utf8');
    await sync(c.worldDir);
  }
}
