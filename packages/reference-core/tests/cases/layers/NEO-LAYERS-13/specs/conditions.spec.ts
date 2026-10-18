// conditions.spec.ts — spec for NEO-LAYERS-13, the conditional-rank case. It takes { page, url,
// case } with the consumer world synced standalone. It syncs the ext and lay upstreams for
// real, wires ext under extends and lay under layers, re-syncs, then reads each probe's
// computed colour under light and dark and at wide and narrow container widths. Emits nothing
// on success; throws naming the probe, the scenario and the colour that broke the rank.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync } from '../../../../../src/sync/index.ts';
import {
  blockSpan,
  readSheet,
  restoreWorld,
  syncUpstream,
  wireConfig,
  writeConfig,
  type PublishedBaseSystem,
  type Wiring,
} from '../../shared/upstream.ts';

interface SpecInput {
  page: SpecPage;
  url: string;
  case: NeoCase;
}

type Mode = 'light' | 'dark';
type Width = 'wide' | 'narrow';
type Scenario = `${Mode}-${Width}`;

const EXT = 'neo-layers13-ext';
const LAY = 'neo-layers13-lay';
const OWN = 'neo-layers13';
const STATEMENT = `@layer ${EXT}, ${LAY}, ${OWN};`;
// Class names the upstream syncs emit for each conditional utility. The colon is escaped in CSS.
const EXT_BASE = `${EXT}__c_extInk`;
const EXT_DARK = `${EXT}__dark:c_extDark`;
const EXT_SM = `${EXT}__sm:c_extSm`;
const LAY_DARK = `${LAY}__dark:c_layDark`;
const LAY_SM = `${LAY}__sm:c_laySm`;

// Computed colours of the literal and token values, as the browser serialises them.
const OWN_BASE = 'rgb(21, 128, 61)';
const OWN_DARK = 'rgb(124, 58, 237)';
const OWN_SM = 'rgb(220, 38, 38)';
const LAY_DARK_RGB = 'rgb(15, 118, 110)';
const LAY_SM_RGB = 'rgb(190, 24, 93)';
const EXT_INK_RGB = 'rgb(29, 78, 216)';

// The sibling carries no rule, so its computed colour is what an unranked probe inherits.
const SIBLING = 'plain';

interface Probe {
  id: string;
  expect: Record<Scenario, string>;
}

// Every probe's truth table over light/dark and wide/narrow. A value of SIBLING means no rule
// on the probe applies in that scenario, so the probe must match the unstyled sibling there.
const PROBES: readonly Probe[] = [
  {
    id: 'dark-own-base',
    expect: { 'light-wide': OWN_BASE, 'dark-wide': OWN_BASE, 'light-narrow': OWN_BASE, 'dark-narrow': OWN_BASE },
  },
  {
    id: 'dark-own-dark',
    expect: { 'light-wide': SIBLING, 'dark-wide': OWN_DARK, 'light-narrow': SIBLING, 'dark-narrow': OWN_DARK },
  },
  {
    id: 'dark-layer-over-ext-dark',
    expect: { 'light-wide': SIBLING, 'dark-wide': LAY_DARK_RGB, 'light-narrow': SIBLING, 'dark-narrow': LAY_DARK_RGB },
  },
  {
    id: 'dark-layer-over-ext-base',
    expect: { 'light-wide': EXT_INK_RGB, 'dark-wide': LAY_DARK_RGB, 'light-narrow': EXT_INK_RGB, 'dark-narrow': LAY_DARK_RGB },
  },
  {
    id: 'wide-own-base',
    expect: { 'light-wide': OWN_BASE, 'dark-wide': OWN_BASE, 'light-narrow': OWN_BASE, 'dark-narrow': OWN_BASE },
  },
  {
    id: 'wide-own-sm',
    expect: { 'light-wide': OWN_SM, 'dark-wide': OWN_SM, 'light-narrow': SIBLING, 'dark-narrow': SIBLING },
  },
  {
    id: 'wide-layer-over-ext-sm',
    expect: { 'light-wide': LAY_SM_RGB, 'dark-wide': LAY_SM_RGB, 'light-narrow': SIBLING, 'dark-narrow': SIBLING },
  },
  {
    id: 'wide-layer-over-ext-base',
    expect: { 'light-wide': LAY_SM_RGB, 'dark-wide': LAY_SM_RGB, 'light-narrow': EXT_INK_RGB, 'dark-narrow': EXT_INK_RGB },
  },
];

// The published utilities must carry each conditional rule the probes depend on, so a renamed
// class fails loud here instead of silently painting nothing.
function assertEmits(system: PublishedBaseSystem, className: string): void {
  const utilities = (system.streams ?? []).map((s) => s.utilities ?? '').join('\n');
  const escaped = className.replace(':', '\\:');
  assert.ok(utilities.includes(escaped), `${system.name} sync emits .${escaped}`);
}

// The sheet opens with the statement, then the ext, lay and own blocks in that order, and
// each conditional rule lands in the block of the layer that authored it.
function assertSheetRanks(styles: string): void {
  assert.ok(styles.includes(STATEMENT), `served sheet carries ${STATEMENT}`);
  const ext = blockSpan(styles, EXT, LAY);
  const lay = blockSpan(styles, LAY, OWN);
  const own = blockSpan(styles, OWN);
  assert.ok(ext.from >= 0 && ext.from < lay.from && lay.from < own.from, 'blocks follow ext, lay, own');
  const inside = (text: string, span: { from: number; to: number }): boolean => {
    const at = styles.indexOf(text);
    return at > span.from && at < span.to;
  };
  assert.ok(inside('var(--colors-ext-dark)', ext), 'extends block carries its dark rule');
  assert.ok(inside('var(--colors-ext-sm)', ext), 'extends block carries its wide rule');
  assert.ok(inside('var(--colors-lay-dark)', lay), 'layers block carries its dark rule');
  assert.ok(inside('var(--colors-lay-sm)', lay), 'layers block carries its wide rule');
  assert.ok(inside('#7c3aed', own), 'own block carries its dark rule');
  assert.ok(inside('#dc2626', own), 'own block carries its wide rule');
}

// Reads one probe's computed colour, or the sibling's in the same scenario.
async function colorOf(page: SpecPage, id: string): Promise<string> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  return node.evaluate((el) => getComputedStyle(el).color);
}

// The page evaluator takes no argument, so each mode and width is its own literal function.
async function setMode(page: SpecPage, mode: Mode): Promise<void> {
  if (mode === 'dark') {
    await page.locator('html').evaluate((el) => el.setAttribute('data-color-mode', 'dark'));
  } else {
    await page.locator('html').evaluate((el) => el.setAttribute('data-color-mode', 'light'));
  }
}

// The container is 800px (wide, above the 640px sm breakpoint) or 400px (narrow, below it).
async function setWidth(page: SpecPage, width: Width): Promise<void> {
  if (width === 'wide') {
    await page.locator('#root').evaluate((el) => {
      el.style.width = '800px';
    });
  } else {
    await page.locator('#root').evaluate((el) => {
      el.style.width = '400px';
    });
  }
}

// Sets the colour mode and the container width for one scenario.
async function enter(page: SpecPage, scenario: Scenario): Promise<void> {
  const [mode, width] = scenario.split('-') as [Mode, Width];
  await setMode(page, mode);
  await setWidth(page, width);
}

// Each probe paints its truth-table value in every scenario, or matches the sibling where none applies.
async function assertScenario(page: SpecPage, scenario: Scenario): Promise<void> {
  await enter(page, scenario);
  const sibling = await colorOf(page, SIBLING);
  for (const probe of PROBES) {
    const want = probe.expect[scenario];
    const expected = want === SIBLING ? sibling : want;
    const got = await colorOf(page, probe.id);
    assert.equal(got, expected, `${probe.id} in ${scenario}: expected ${expected}, got ${got}`);
  }
}

// The consumer's ui.config lists ext under extends and lay under layers, by relative import.
function layeredWiring(): Wiring {
  return {
    links: [
      { binding: 'extUpstream', from: '../upstreams/ext/.reference-ui/system/baseSystem.mjs' },
      { binding: 'layUpstream', from: '../upstreams/lay/.reference-ui/system/baseSystem.mjs' },
    ],
    extends: ['extUpstream'],
    layers: ['layUpstream'],
  };
}

// Syncs both upstreams for real and checks each conditional class they publish.
async function syncUpstreams(caseDir: string): Promise<void> {
  const ext = await syncUpstream(path.join(caseDir, 'upstreams', 'ext'));
  const lay = await syncUpstream(path.join(caseDir, 'upstreams', 'lay'));
  assert.equal(ext.name, EXT, `extends upstream publishes its name, got ${ext.name}`);
  assert.equal(lay.name, LAY, `layers upstream publishes its name, got ${lay.name}`);
  assertEmits(ext, EXT_BASE);
  assertEmits(ext, EXT_DARK);
  assertEmits(ext, EXT_SM);
  assertEmits(lay, LAY_DARK);
  assertEmits(lay, LAY_SM);
}

// Wires both buckets, re-syncs, checks the sheet ranks, then reads every probe under every scenario.
export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  const canonical = fs.readFileSync(path.join(c.worldDir, 'ui.config.ts'), 'utf8');
  await syncUpstreams(c.dir);
  try {
    writeConfig(c.worldDir, wireConfig(canonical, layeredWiring()));
    await sync(c.worldDir);
    assertSheetRanks(readSheet(c.worldDir));
    await page.goto(`${url}?layers=13`, { waitUntil: 'load' });
    await page.locator('#root').waitFor();
    for (const scenario of ['light-wide', 'dark-wide', 'light-narrow', 'dark-narrow'] as const) {
      await assertScenario(page, scenario);
    }
  } finally {
    await restoreWorld(c.worldDir, canonical);
  }
}
