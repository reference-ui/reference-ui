// diamond.spec.ts — spec for NEO-LAYERS-11, the diamond case. It takes { page, url, case } with the
// consumer world synced by the runner. It syncs the shared base for real, then two branches that each
// extend it, then the consumer, which extends one branch and layers the other. It checks the served
// statement, the package block order (the shared base once) and the computed paints, and restores every
// canonical config in a finally. Emits nothing on success; throws naming the failed assertion on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync } from '../../../../../src/sync/index.ts';
import {
  configPathOf,
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

interface Probe {
  id: string;
  rgb: string;
}

const BASE = 'neo-layers11-a';
const BRANCH_B = 'neo-layers11-b';
const BRANCH_C = 'neo-layers11-c';
const OWN = 'neo-layers11';
const A_RGB = 'rgb(29, 78, 216)';
const B_RGB = 'rgb(190, 24, 93)';
const C_RGB = 'rgb(21, 128, 61)';

// The statement lists each layer once, in first-occurrence order; the blocks follow the same order.
const STATEMENT = `@layer ${BASE}, ${BRANCH_B}, ${BRANCH_C}, ${OWN};`;
const BLOCKS = [BASE, BRANCH_B, BRANCH_C, OWN];
const PROBES: Probe[] = [
  { id: 'a-only', rgb: A_RGB },
  { id: 'b-only', rgb: B_RGB },
  { id: 'race', rgb: C_RGB },
];

// Each upstream's rule text as its sync emits it; a renamed class fails loud here.
const BASE_RULE = `.${BASE}__c_aInk { color: var(--colors-a-ink); }`;
const B_RULE = `.${BRANCH_B}__c_bInk { color: var(--colors-b-ink); }`;
const C_RULE = `.${BRANCH_C}__c_cInk { color: var(--colors-c-ink); }`;

const PACKAGE_BLOCK = /^@layer (neo-layers11[a-z0-9-]*) \{$/;
const STATEMENT_LINE = /^@layer neo-layers11[^{]*;$/;

function upstreamDir(c: NeoCase, dir: string): string {
  return path.join(c.dir, 'upstreams', dir);
}

function canonicalOf(dir: string): string {
  return fs.readFileSync(configPathOf(dir), 'utf8');
}

// Each branch extends the shared base for its sync, so the base's streams ride the branch's published system.
function branchWiring(): Wiring {
  return {
    links: [{ binding: 'baseUpstream', from: '../a/.reference-ui/system/baseSystem.mjs' }],
    extends: ['baseUpstream'],
    layers: [],
  };
}

// The consumer extends branch b and layers branch c, so the shared base is reached through both.
function consumerWiring(): Wiring {
  return {
    links: [
      { binding: 'bUpstream', from: '../upstreams/b/.reference-ui/system/baseSystem.mjs' },
      { binding: 'cUpstream', from: '../upstreams/c/.reference-ui/system/baseSystem.mjs' },
    ],
    extends: ['bUpstream'],
    layers: ['cUpstream'],
  };
}

function emittedUtilities(system: PublishedBaseSystem): string {
  return (system.streams ?? []).map((stream) => stream.utilities ?? '').join('\n');
}

function streamNames(system: PublishedBaseSystem): string[] {
  return (system.streams ?? []).map((stream) => stream.name);
}

// Syncs the shared base for real and checks the name and rule it publishes.
async function syncBase(dir: string): Promise<void> {
  const published = await syncUpstream(dir);
  assert.equal(published.name, BASE, 'the shared base publishes its name');
  assert.ok(emittedUtilities(published).includes(BASE_RULE), 'the shared base emits its rule');
}

// Writes one branch to extend the shared base, syncs it, and checks it reaches the base through its streams.
async function syncBranch(dir: string, name: string, canonical: string, rule: string): Promise<void> {
  writeConfig(dir, wireConfig(canonical, branchWiring()));
  const published = await syncUpstream(dir);
  assert.equal(published.name, name, `${name} publishes its name`);
  assert.ok(streamNames(published).includes(BASE), `${name} reaches the shared base through its streams`);
  assert.ok(emittedUtilities(published).includes(rule), `${name} emits its rule`);
}

// The statement and the block order are read from the served sheet, the one oracle for the cascade.
function statementLines(styles: string): string[] {
  return styles.split('\n').filter((line) => STATEMENT_LINE.test(line));
}

function packageBlocks(styles: string): string[] {
  const names: string[] = [];
  for (const line of styles.split('\n')) {
    const hit = PACKAGE_BLOCK.exec(line);
    if (hit) names.push(hit[1]);
  }
  return names;
}

// Each probe's computed colour must be its own layer's, so the race probe proves branch c beats branch b.
async function assertPaints(page: SpecPage): Promise<void> {
  for (const probe of PROBES) {
    const node = page.locator(`#${probe.id}`);
    await node.waitFor();
    const color = await node.evaluate((el) => getComputedStyle(el).color);
    assert.equal(color, probe.rgb, `#${probe.id} paints ${probe.rgb}, got ${color}`);
  }
}

// Puts every canonical config back and re-syncs it, so the tree is canonical whatever the run did.
async function restoreAll(
  c: NeoCase,
  canonical: { world: string; b: string; c: string }
): Promise<void> {
  await restoreWorld(upstreamDir(c, 'b'), canonical.b);
  await restoreWorld(upstreamDir(c, 'c'), canonical.c);
  await restoreWorld(c.worldDir, canonical.world);
}

export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  const canonical = {
    world: canonicalOf(c.worldDir),
    b: canonicalOf(upstreamDir(c, 'b')),
    c: canonicalOf(upstreamDir(c, 'c')),
  };

  try {
    await syncBase(upstreamDir(c, 'a'));
    await syncBranch(upstreamDir(c, 'b'), BRANCH_B, canonical.b, B_RULE);
    await syncBranch(upstreamDir(c, 'c'), BRANCH_C, canonical.c, C_RULE);

    writeConfig(c.worldDir, wireConfig(canonical.world, consumerWiring()));
    const result = await sync(c.worldDir);
    assert.ok(
      !result.diagnostics.some((d) => d.severity === 'error'),
      'the diamond consumer syncs without errors'
    );

    const styles = readSheet(c.worldDir);
    assert.deepEqual(statementLines(styles), [STATEMENT], 'the order statement lists each layer once');
    assert.deepEqual(packageBlocks(styles), BLOCKS, 'the shared base prints once, first in order');

    await page.goto(`${url}?variant=diamond`, { waitUntil: 'load' });
    await assertPaints(page);
  } finally {
    await restoreAll(c, canonical);
  }
}
