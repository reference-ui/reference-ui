// global.spec.ts — spec for NEO-LAYERS-08, the layer global-CSS case. It takes { page, url, case }
// with the consumer world synced standalone. It syncs the up upstream for real, wires it under
// layers, re-syncs, then checks the served sheet's block contents and the computed paints.
// Emits nothing on success; throws naming the block, rule or paint that broke the claim.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync } from '../../../../../src/sync/index.ts';
import {
  blockSpan,
  configPathOf,
  readSheet,
  restoreWorld,
  syncUpstream,
  wireConfig,
  writeConfig,
  type BlockSpan,
  type PublishedBaseSystem,
  type Wiring,
} from '../../shared/upstream.ts';

interface SpecInput {
  page: SpecPage;
  url: string;
  case: NeoCase;
}

const UP = 'neo-layers8-up';
const OWN = 'neo-layers8';
const STATEMENT = `@layer ${UP}, ${OWN};`;

// Rule texts the upstream's global stream prints, and the marker texts the claims depend on.
const UP_PROBE_RULE = '.up-probe { color: #be185d }';
const UP_ONLY_RULE = '.up-only { color: #0f766e }';
const OWN_PROBE_RULE = '.up-probe { color: #15803d }';
const FONT_FACE_OPEN = '@font-face {';
const KEYFRAMES_OPEN = '@keyframes upPulse {';
const RESET_OPEN = '@layer reset {';
const RESET_MARKER = 'box-sizing: border-box';
const ROOT_MARKER = '--spacing-root';
const TOKEN_VAR = '--colors-up-ink';

// Paints the probes must show: own wins on the shared selector, the layer paints its own selector.
const OWN_RGB = 'rgb(21, 128, 61)';
const UP_ONLY_RGB = 'rgb(15, 118, 110)';
const TOKEN_VALUE = '#be185d';

function countOf(text: string, needle: string): number {
  return text.split(needle).length - 1;
}

function within(styles: string, span: BlockSpan): string {
  return styles.slice(span.from, span.to);
}

// The published upstream carries each thing the sheet must lack, so the absence claims are not vacuous.
function assertPublished(system: PublishedBaseSystem): void {
  const entry = system.streams?.[0];
  assert.ok(entry, 'upstream publishes a stream entry');
  assert.ok(entry.reset?.includes(RESET_MARKER), `upstream publishes a reset carrying ${RESET_MARKER}`);
  assert.ok(entry.root?.includes(ROOT_MARKER), `upstream publishes a root default carrying ${ROOT_MARKER}`);
  assert.ok(entry.global?.includes(UP_PROBE_RULE), `upstream publishes ${UP_PROBE_RULE} in global`);
  assert.ok(entry.tokensPortable?.includes(TOKEN_VAR), `upstream publishes ${TOKEN_VAR} in tokensPortable`);
}

// Every global rule the upstream prints lands once in its block, and the own rule wins by rank.
function assertGlobalBlock(styles: string): void {
  assert.ok(styles.includes(STATEMENT), `served sheet carries ${STATEMENT}`);
  const up = blockSpan(styles, UP, OWN);
  const own = blockSpan(styles, OWN);
  assert.ok(up.from >= 0 && up.from < up.to && up.to <= own.from, 'the upstream block precedes the own block');
  const block = within(styles, up);
  assert.equal(countOf(block, UP_PROBE_RULE), 1, `upstream block prints ${UP_PROBE_RULE} once`);
  assert.equal(countOf(block, UP_ONLY_RULE), 1, `upstream block prints ${UP_ONLY_RULE} once`);
  assert.equal(countOf(block, FONT_FACE_OPEN), 1, 'upstream block prints one @font-face');
  assert.equal(countOf(block, KEYFRAMES_OPEN), 1, 'upstream block prints one @keyframes upPulse');
  assert.equal(countOf(styles, FONT_FACE_OPEN), 1, 'the sheet prints the @font-face once overall');
  assert.equal(countOf(styles, KEYFRAMES_OPEN), 1, 'the sheet prints @keyframes upPulse once overall');
  assert.equal(countOf(styles, UP_ONLY_RULE), 1, 'the sheet prints the layer-only global rule once overall');
  assert.equal(countOf(styles, OWN_PROBE_RULE), 1, 'the own global rule prints once in the own block');
  assert.ok(within(styles, own).includes(OWN_PROBE_RULE), 'the own global rule sits in the own block');
}

// The upstream's reset, root default and :root-hoisted tokens are absent from its block and the sheet.
function assertAbsences(styles: string): void {
  const up = blockSpan(styles, UP, OWN);
  const block = within(styles, up);
  assert.ok(!block.includes(RESET_OPEN), 'the upstream block prints no reset layer');
  assert.ok(!block.includes(RESET_MARKER), `the upstream block carries no ${RESET_MARKER}`);
  assert.equal(countOf(styles, RESET_OPEN), 1, 'the only reset in the sheet is the own one');
  assert.ok(!block.includes(ROOT_MARKER), `the upstream block carries no ${ROOT_MARKER}`);
  assert.equal(countOf(styles, ROOT_MARKER + ':'), 1, 'the only root default in the sheet is the own one');
  assertTokensScoped(styles);
}

// Every declaration of the upstream's token sits under its data-layer selector, never under :root.
function assertTokensScoped(styles: string): void {
  let at = styles.indexOf(`${TOKEN_VAR}:`);
  assert.ok(at >= 0, `the sheet declares ${TOKEN_VAR} in the layer's scope`);
  while (at >= 0) {
    const open = styles.lastIndexOf('{', at);
    const selector = styles.slice(0, open).split('\n').pop() ?? '';
    assert.ok(
      selector.includes(`[data-layer="${UP}"]`),
      `${TOKEN_VAR} is declared under a data-layer selector, not "${selector.trim()}"`,
    );
    at = styles.indexOf(`${TOKEN_VAR}:`, at + 1);
  }
}

async function paintOf(page: SpecPage, id: string): Promise<string> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  return node.evaluate((el) => getComputedStyle(el).color);
}

// Own wins the shared selector, the layer paints its own, and the root carries no layer token.
async function assertComputed(page: SpecPage): Promise<void> {
  const shared = await page.locator('#own-probe').evaluate((el) => el.className);
  assert.equal(shared, 'up-probe', `the shared probe carries the class both systems style: ${shared}`);
  assert.equal(await paintOf(page, 'own-probe'), OWN_RGB, 'own wins the selector both systems style');
  const only = await page.locator('#up-only').evaluate((el) => el.className);
  assert.equal(only, 'up-only', `the layer-only probe carries its class: ${only}`);
  assert.equal(await paintOf(page, 'up-only'), UP_ONLY_RGB, 'the layer global rule paints its own selector');
  const root = await page.locator('html').evaluate((el) => getComputedStyle(el).getPropertyValue('--colors-up-ink').trim());
  assert.equal(root, '', `${TOKEN_VAR} is empty at :root, got "${root}"`);
  const scoped = await page
    .locator('#layer-token-probe')
    .evaluate((el) => getComputedStyle(el).getPropertyValue('--colors-up-ink').trim());
  assert.equal(scoped, TOKEN_VALUE, `${TOKEN_VAR} resolves inside its data-layer scope, got "${scoped}"`);
}

// The consumer lists the upstream under layers only, by relative import, so extends stays empty.
function layeredWiring(): Wiring {
  return {
    links: [{ binding: 'upUpstream', from: '../upstreams/up/.reference-ui/system/baseSystem.mjs' }],
    extends: [],
    layers: ['upUpstream'],
  };
}

// Syncs the upstream for real, asserts what it publishes, wires it under layers, and checks the sheet and paints.
export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  const canonical = fs.readFileSync(configPathOf(c.worldDir), 'utf8');
  const published = await syncUpstream(path.join(c.dir, 'upstreams', 'up'));
  assert.equal(published.name, UP, `upstream publishes its name, got ${published.name}`);
  assertPublished(published);
  try {
    writeConfig(c.worldDir, wireConfig(canonical, layeredWiring()));
    await sync(c.worldDir);
    const styles = readSheet(c.worldDir);
    assertGlobalBlock(styles);
    assertAbsences(styles);
    await page.goto(`${url}?layers=8`, { waitUntil: 'load' });
    await assertComputed(page);
  } finally {
    await restoreWorld(c.worldDir, canonical);
  }
}
