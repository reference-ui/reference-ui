// layered-consumer-content.spec.ts — spec for CORE-LAYERS-10, the consumer-content case. It takes
// { page, url, case } with the consumer world synced standalone. It syncs the up upstream for real,
// lists it under layers and re-syncs, copies the upstream's published react entry beside the world,
// then loads the page once per color-mode leg and reads the layered root and the consumer Div nested
// in it. Emits nothing on success; throws naming the leg and the stamp or paint that broke. The
// canonical config is restored in a finally.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { CoreCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync } from '../../../../../src/sync/index.ts';
import {
  blockSpan,
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
  case: CoreCase;
}

interface Leg {
  label: string;
  query: string;
  htmlMode: string | null;
  upPaint: string;
  ownPaint: string;
}

interface RootReading {
  stamp: string | null;
  color: string;
}

interface ChildReading extends RootReading {
  nested: boolean;
}

const OWN = 'core-layers10';
const UP = 'core-layers10-up';
const UP_CLASS = `${UP}__c_probeInk`;
const OWN_CLASS = `${OWN}__c_probeInk`;

// Computed colours of the probeInk leaves, as the browser serialises them: the upstream's
// #be185d and #f9a8d4, and the consumer's #15803d and #86efac.
const UP_LIGHT = 'rgb(190, 24, 93)';
const UP_DARK = 'rgb(249, 168, 212)';
const OWN_LIGHT = 'rgb(21, 128, 61)';
const OWN_DARK = 'rgb(134, 239, 172)';

// Where the spec copies the upstream's published react entry inside the world. The page's importmap
// maps the bare name core-layers10-up to this path (see world/index.html).
const UP_REACT_COPY = path.join('.reference-ui', 'upstream', 'react.mjs');

// Three legs, one page load each. The query string sets html data-color-mode before the first
// render, so the colour mode is already in effect when the primitives read it. Legs 2 and 3 are
// the ones where a shared scope boolean once dropped the child's stamp.
const LEGS: readonly Leg[] = [
  { label: 'no html data-color-mode', query: '', htmlMode: null, upPaint: UP_LIGHT, ownPaint: OWN_LIGHT },
  { label: 'html data-color-mode="light"', query: '?mode=light', htmlMode: 'light', upPaint: UP_LIGHT, ownPaint: OWN_LIGHT },
  { label: 'html data-color-mode="dark"', query: '?mode=dark', htmlMode: 'dark', upPaint: UP_DARK, ownPaint: OWN_DARK },
];

// The consumer lists the up upstream under layers, by relative import.
function layeredWiring(): Wiring {
  return {
    links: [{ binding: 'upUpstream', from: '../upstreams/up/.reference-ui/system/baseSystem.mjs' }],
    extends: [],
    layers: ['upUpstream'],
  };
}

function assertIn(styles: string, rule: string, span: BlockSpan, what: string): void {
  const at = styles.indexOf(rule);
  assert.ok(
    at > span.from && at < span.to,
    `${what} carries ${rule} (at ${at}, block ${span.from}..${span.to})`,
  );
}

// The upstream block opens the layered section and carries its probeInk rule. The own block
// carries the consumer's rule for the same token name, so the two scopes are read apart.
function assertSheet(styles: string): void {
  const up = blockSpan(styles, UP, OWN);
  const own = blockSpan(styles, OWN);
  assert.ok(up.from >= 0 && up.from < own.from, 'the upstream block precedes the own block');
  assertIn(styles, `.${UP_CLASS} {`, up, 'layers block');
  assertIn(styles, `.${OWN_CLASS} {`, own, 'own block');
}

// The html colour mode, read from the document element after the page has rendered.
async function htmlModeOf(page: SpecPage): Promise<string | null> {
  return page.locator('html').evaluate((el) => el.getAttribute('data-color-mode'));
}

// The layered root: its own stamp and its computed ink.
async function readRoot(page: SpecPage): Promise<RootReading> {
  const node = page.locator('#up-layered');
  await node.waitFor();
  return node.evaluate((el) => ({
    stamp: el.getAttribute('data-layer'),
    color: getComputedStyle(el).color,
  }));
}

// The consumer child: its own stamp, its computed ink, and whether it sits inside the layered root.
async function readChild(page: SpecPage): Promise<ChildReading> {
  const node = page.locator('#consumer-child');
  await node.waitFor();
  return node.evaluate((el) => ({
    stamp: el.getAttribute('data-layer'),
    color: getComputedStyle(el).color,
    nested: el.closest('#up-layered') !== null,
  }));
}

// One leg: the html mode, the layered root's stamp and paint, then the consumer child's nesting,
// stamp and paint. Every assertion names the leg, so a failure says which colour mode broke.
async function assertLeg(page: SpecPage, leg: Leg): Promise<void> {
  assert.equal(
    await htmlModeOf(page),
    leg.htmlMode,
    `${leg.label}: html carries the leg's color mode`,
  );
  const root = await readRoot(page);
  assert.equal(root.stamp, UP, `${leg.label}: the layered root stamps ${UP}, got ${root.stamp}`);
  assert.equal(
    root.color,
    leg.upPaint,
    `${leg.label}: the layered root paints the upstream value, got ${root.color}`,
  );
  const child = await readChild(page);
  assert.ok(child.nested, `${leg.label}: the consumer Div renders inside the layered root`);
  assert.equal(
    child.stamp,
    OWN,
    `${leg.label}: the nested consumer Div stamps ${OWN}, got ${child.stamp}`,
  );
  assert.equal(
    child.color,
    leg.ownPaint,
    `${leg.label}: the nested consumer Div paints the consumer value, got ${child.color}`,
  );
}

// Syncs the upstream for real, lists it under layers, re-syncs, copies its react entry into the
// world, then reads each leg. Restores the canonical config and re-syncs in the finally.
export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  const configPath = path.join(c.worldDir, 'ui.config.ts');
  const canonical = fs.readFileSync(configPath, 'utf8');
  const upDir = path.join(c.dir, 'upstreams', 'up');
  const upReactSource = path.join(upDir, '.reference-ui', 'react', 'react.mjs');

  const published = await syncUpstream(upDir);
  assert.equal(published.name, UP, `upstream publishes its name, got ${published.name}`);
  const upReact = fs.readFileSync(upReactSource, 'utf8');
  assert.ok(upReact.includes(UP), `upstream publishes a react entry bound to ${UP}`);

  try {
    writeConfig(c.worldDir, wireConfig(canonical, layeredWiring()));
    await sync(c.worldDir);
    assertSheet(readSheet(c.worldDir));
    const copy = path.join(c.worldDir, UP_REACT_COPY);
    fs.mkdirSync(path.dirname(copy), { recursive: true });
    fs.copyFileSync(upReactSource, copy);
    for (const leg of LEGS) {
      await page.goto(`${url}${leg.query}`, { waitUntil: 'load' });
      await assertLeg(page, leg);
    }
  } finally {
    await restoreWorld(c.worldDir, canonical);
  }
}
