// lifecycle.spec.ts — spec for NEO-LAYERS-15, the layer lifecycle case. It takes { page, url, case }
// with the consumer world synced standalone. It wires the lc upstream under layers by a relative
// import, then runs two legs: an explicit re-sync after the upstream removes a utility, and a
// live watch that re-syncs the consumer after the upstream is rebuilt with a new ink. Emits nothing
// on success; throws naming the leg, the rule that went stale or the paint that did not follow.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync } from '../../../../../src/sync/index.ts';
import { watchSync, type WatchHandle } from '../../../../../src/lib/watch/index.ts';
import {
  configPathOf,
  readPublished,
  readSheet,
  restoreWorld,
  syncUpstream,
  wireConfig,
  writeConfig,
  type Wiring,
} from '../../shared/upstream.ts';

interface SpecInput {
  page: SpecPage;
  url: string;
  case: NeoCase;
}

const UP = 'neo-layers15-lc';
const OWN = 'neo-layers15';
const STATEMENT = `@layer ${UP}, ${OWN};`;
const INK_V1 = '#be185d';
const INK_V2 = '#0f766e';
const INK_DECL_V1 = `--colors-lc-ink: ${INK_V1}`;
const INK_DECL_V2 = `--colors-lc-ink: ${INK_V2}`;
const PAPER_CLASS = `${UP}__bg-c_lcPaper`;
const INK_CLASS = `${UP}__c_lcInk`;
const INK_RGB_V1 = 'rgb(190, 24, 93)';
const INK_RGB_V2 = 'rgb(15, 118, 110)';
const PAPER_RGB = 'rgb(204, 251, 241)';
const TRANSPARENT = 'rgba(0, 0, 0, 0)';

const TOKEN_FILE = path.join('theme', 'tokens.ts');
const UTILITY_FILE = path.join('src', 'utilities.ts');
// The paper line the removal leg deletes; its exact text is the upstream's own source.
const PAPER_LINE = "export const lcPaperClass = css({ backgroundColor: 'lcPaper' })\n";

// Poll until cond holds or the budget burns; a watch resync costs a full native compile.
async function waitFor(cond: () => boolean, label: string, errors: string[]): Promise<void> {
  const deadline = Date.now() + 90000;
  while (!cond()) {
    assert.ok(Date.now() < deadline, `timed out waiting for ${label}${errors.length ? `: ${errors.join('; ')}` : ''}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The upstream's published utilities must carry each rule the probes depend on, so a renamed class
// fails loud here instead of silently painting nothing.
function assertEmits(utilities: string, rule: string): void {
  assert.ok(utilities.includes(rule), `upstream sync emits ${rule}`);
}

function publishedUtilities(upDir: string): string {
  return (readPublished(upDir).streams ?? []).map((s) => s.utilities ?? '').join('\n');
}

function publishedTokens(upDir: string): string {
  return (readPublished(upDir).streams ?? []).map((s) => s.tokensPortable ?? '').join('\n');
}

// Reads one probe's computed background colour after a reload of the served page.
async function bgOf(page: SpecPage, url: string, id: string): Promise<string> {
  await page.goto(`${url}?leg=${id}`, { waitUntil: 'load' });
  const node = page.locator(`#${id}`);
  await node.waitFor();
  return node.evaluate((el) => getComputedStyle(el).backgroundColor);
}

async function inkOf(page: SpecPage, url: string, leg: string): Promise<string> {
  await page.goto(`${url}?leg=${leg}`, { waitUntil: 'load' });
  const node = page.locator('#ink-probe');
  await node.waitFor();
  return node.evaluate((el) => getComputedStyle(el).color);
}

// Leg A: the upstream drops the paper utility and is re-synced; an explicit consumer re-sync must drop
// the rule from the sheet and from the paint, and keep the ink.
async function removeLeg(input: SpecInput, lcDir: string, world: string, canonicalUtilities: string): Promise<void> {
  const { page, url } = input;
  fs.writeFileSync(path.join(lcDir, UTILITY_FILE), swapLine(canonicalUtilities), 'utf8');
  await sync(lcDir);
  const utilities = publishedUtilities(lcDir);
  assert.ok(!utilities.includes(PAPER_CLASS), `the upstream publishes no ${PAPER_CLASS} after the removal`);
  assertEmits(utilities, INK_CLASS);
  await sync(world);
  const sheet = readSheet(world);
  assert.ok(!sheet.includes(PAPER_CLASS), `re-sync drops ${PAPER_CLASS} from the consumer sheet`);
  assert.ok(sheet.includes(INK_DECL_V1), `re-sync keeps the ink at ${INK_DECL_V1}`);
  assert.equal(await bgOf(page, url, 'paper-probe'), TRANSPARENT, 'the dropped paper no longer paints');
  assert.equal(await inkOf(page, url, 'removal'), INK_RGB_V1, 'the kept ink still paints');
}

// Removes the paper line from the utilities source; a missing anchor means the canonical source changed.
function swapLine(text: string): string {
  if (!text.includes(PAPER_LINE)) throw new Error('canonical upstream utilities lost the paper line');
  return text.replace(PAPER_LINE, '');
}

// Leg B: a live watch on the consumer re-syncs after the upstream is rebuilt with a new ink.
async function watchLeg(input: SpecInput, lcDir: string, world: string, canonicalTokens: string): Promise<void> {
  const { page, url } = input;
  const errors: string[] = [];
  let resyncs = 0;
  const handle: WatchHandle = await watchSync(world, {
    onResync: () => {
      resyncs += 1;
    },
    onError: (error) => {
      errors.push(error.message);
    },
  });
  try {
    await sleep(1500);
    const before = resyncs;
    fs.writeFileSync(path.join(lcDir, TOKEN_FILE), canonicalTokens.replace(INK_V1, INK_V2), 'utf8');
    await sync(lcDir);
    assert.ok(publishedTokens(lcDir).includes(INK_DECL_V2), `upstream publishes ${INK_DECL_V2} before the watch resync`);
    await waitFor(() => resyncs > before, 'watch resync after the upstream rebuild', errors);
    const sheet = readSheet(world);
    assert.ok(sheet.includes(INK_DECL_V2), `watch re-sync carries ${INK_DECL_V2}`);
    assert.ok(!sheet.includes(INK_DECL_V1), `watch re-sync drops the old ${INK_DECL_V1}`);
    assert.ok(!sheet.includes(PAPER_CLASS), `watch re-sync keeps the removed ${PAPER_CLASS} out`);
    assert.equal(await inkOf(page, url, 'watch'), INK_RGB_V2, 'the watched re-sync paints the new ink');
  } finally {
    await handle.stop();
  }
}

// The consumer lists the lc upstream under layers by a relative import, so the file is a watch input.
function layeredWiring(): Wiring {
  return {
    links: [{ binding: 'lcUpstream', from: '../upstreams/lc/.reference-ui/system/baseSystem.mjs' }],
    extends: [],
    layers: ['lcUpstream'],
  };
}

// Syncs the upstream, wires it under layers, checks the baseline, then runs the removal and watch legs.
export default async function run(input: SpecInput): Promise<void> {
  const { url, case: c } = input;
  const world = c.worldDir;
  const lcDir = path.join(c.dir, 'upstreams', 'lc');
  const canonicalConfig = fs.readFileSync(configPathOf(world), 'utf8');
  const canonicalTokens = fs.readFileSync(path.join(lcDir, TOKEN_FILE), 'utf8');
  const canonicalUtilities = fs.readFileSync(path.join(lcDir, UTILITY_FILE), 'utf8');
  const published = await syncUpstream(lcDir);
  assert.equal(published.name, UP, `upstream publishes its name, got ${published.name}`);
  assertEmits(publishedUtilities(lcDir), PAPER_CLASS);
  try {
    writeConfig(world, wireConfig(canonicalConfig, layeredWiring()));
    await sync(world);
    const sheet = readSheet(world);
    assert.ok(sheet.includes(STATEMENT), `baseline sheet carries ${STATEMENT}`);
    assert.ok(sheet.includes(INK_DECL_V1), `baseline sheet carries ${INK_DECL_V1}`);
    assert.ok(sheet.includes(PAPER_CLASS), `baseline sheet carries ${PAPER_CLASS}`);
    assert.equal(await inkOf(input.page, url, 'baseline'), INK_RGB_V1, 'baseline ink paints');
    assert.equal(await bgOf(input.page, url, 'paper-probe'), PAPER_RGB, 'baseline paper paints');
    await removeLeg(input, lcDir, world, canonicalUtilities);
    await watchLeg(input, lcDir, world, canonicalTokens);
  } finally {
    fs.writeFileSync(path.join(lcDir, TOKEN_FILE), canonicalTokens, 'utf8');
    fs.writeFileSync(path.join(lcDir, UTILITY_FILE), canonicalUtilities, 'utf8');
    await sync(lcDir);
    await restoreWorld(world, canonicalConfig);
  }
}
