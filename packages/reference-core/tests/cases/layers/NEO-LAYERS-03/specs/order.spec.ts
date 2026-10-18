// order.spec.ts — spec for NEO-LAYERS-03, the layer order case. Takes { page, url, case } with the
// consumer world synced standalone. It syncs three upstreams for real, then runs two layer
// configurations that list the same systems in opposite order, and checks each served statement,
// block order and computed colours, restoring the canonical config in a finally. Emits nothing on
// success; throws naming the failed assertion on failure.
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

interface PublishedBaseSystem {
  name: string;
  streams?: Array<{ utilities?: string }>;
}

interface Upstream {
  dir: string;
  name: string;
  rule: string;
}

interface Probe {
  id: string;
  rgb: string;
}

interface Variant {
  key: string;
  layers: string[];
  statement: string;
  blocks: string[];
  probes: Probe[];
}

const A = 'neo-layers3-a';
const B = 'neo-layers3-b';
const C = 'neo-layers3-c';
const OWN = 'neo-layers3';
const A_RGB = 'rgb(29, 78, 216)';
const B_RGB = 'rgb(190, 24, 93)';
const C_RGB = 'rgb(21, 128, 61)';

const PACKAGE_BLOCK = /^@layer (neo-layers3[a-z0-9-]*) \{$/;
const STATEMENT_LINE = /^@layer neo-layers3[^{]*;$/;
const CONFIG_IMPORT = "import { defineConfig } from '@reference-ui/neo'";
const EMPTY_EXTENDS = 'extends: [],';

// Each upstream's rule text as its sync emits it.
const UPSTREAMS: Upstream[] = [
  { dir: 'a', name: A, rule: `.${A}__c_aInk { color: var(--colors-a-ink); }` },
  { dir: 'b', name: B, rule: `.${B}__c_bInk { color: var(--colors-b-ink); }` },
  { dir: 'c', name: C, rule: `.${C}__c_cInk { color: var(--colors-c-ink); }` },
];

// Every variant extends the base upstream A. The layers list and the expected sheet change.
const VARIANTS: Variant[] = [
  {
    key: 'order',
    layers: ['bUpstream', 'cUpstream'],
    statement: `@layer ${A}, ${B}, ${C}, ${OWN};`,
    blocks: [A, B, C, OWN],
    probes: [
      { id: 'a-only', rgb: A_RGB },
      { id: 'b-only', rgb: B_RGB },
      { id: 'race', rgb: C_RGB },
    ],
  },
  {
    key: 'reversed',
    layers: ['cUpstream', 'bUpstream'],
    statement: `@layer ${A}, ${C}, ${B}, ${OWN};`,
    blocks: [A, C, B, OWN],
    probes: [
      { id: 'a-only', rgb: A_RGB },
      { id: 'b-only', rgb: B_RGB },
      { id: 'race', rgb: B_RGB },
    ],
  },
];

function importLine(ident: string, dir: string): string {
  return [
    `import { baseSystem as ${ident} } from`,
    `  '../upstreams/${dir}/.reference-ui/system/baseSystem.mjs'`,
  ].join('\n');
}

const UPSTREAM_IMPORTS = [
  importLine('aUpstream', 'a'),
  importLine('bUpstream', 'b'),
  importLine('cUpstream', 'c'),
];

// Swaps one anchor for its replacement; a missing anchor means the canonical config changed shape.
function swapAnchor(text: string, anchor: string, replacement: string): string {
  const next = text.replace(anchor, replacement);
  if (next === text) throw new Error(`canonical ui.config lost its anchor: ${anchor}`);
  return next;
}

// Imports every upstream, extends the base upstream A, and lists the variant's layers in order.
function variantConfig(canonical: string, layers: string[]): string {
  const withImports = swapAnchor(
    canonical,
    CONFIG_IMPORT,
    [CONFIG_IMPORT, ...UPSTREAM_IMPORTS].join('\n')
  );
  const entry = `extends: [aUpstream],\n  layers: [${layers.join(', ')}],`;
  return swapAnchor(withImports, EMPTY_EXTENDS, entry);
}

function readBaseSystem(root: string): PublishedBaseSystem {
  const raw = fs.readFileSync(
    path.join(root, '.reference-ui', 'system', 'baseSystem.mjs'),
    'utf8'
  );
  return JSON.parse(raw.slice(raw.indexOf('{'))) as PublishedBaseSystem;
}

function emittedUtilities(system: PublishedBaseSystem): string {
  return (system.streams ?? []).map(s => s.utilities ?? '').join('\n');
}

// Syncs each upstream for real and checks it publishes its name and the rule the probes need.
async function syncUpstreams(c: NeoCase): Promise<void> {
  for (const upstream of UPSTREAMS) {
    const root = path.join(c.dir, 'upstreams', upstream.dir);
    await sync(root);
    const published = readBaseSystem(root);
    assert.equal(published.name, upstream.name, `${upstream.dir} publishes its name`);
    assert.ok(
      emittedUtilities(published).includes(upstream.rule),
      `${upstream.name} emits its rule`
    );
  }
}

// The served order statement lines: exactly one, and it must be the variant's expected string.
function statementLines(styles: string): string[] {
  return styles.split('\n').filter(line => STATEMENT_LINE.test(line));
}

// Package blocks in the order the sheet prints them. Nested reset, tokens and utilities blocks
// are not packages and are left out.
function packageBlocks(styles: string): string[] {
  const names: string[] = [];
  for (const line of styles.split('\n')) {
    const hit = PACKAGE_BLOCK.exec(line);
    if (hit) names.push(hit[1]);
  }
  return names;
}

function assertSheet(styles: string, variant: Variant): void {
  assert.deepEqual(
    statementLines(styles),
    [variant.statement],
    `${variant.key} statement`
  );
  assert.deepEqual(packageBlocks(styles), variant.blocks, `${variant.key} block order`);
}

async function assertProbes(page: SpecPage, variant: Variant): Promise<void> {
  for (const probe of variant.probes) {
    const node = page.locator(`#${probe.id}`);
    await node.waitFor();
    const color = await node.evaluate(el => getComputedStyle(el).color);
    assert.equal(
      color,
      probe.rgb,
      `${variant.key}: #${probe.id} paints ${probe.rgb}, got ${color}`
    );
  }
}

// Each variant: rewrite the config, sync, check the served sheet, then check the computed paints.
export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  const configPath = path.join(c.worldDir, 'ui.config.ts');
  const canonical = fs.readFileSync(configPath, 'utf8');
  await syncUpstreams(c);

  try {
    for (const variant of VARIANTS) {
      fs.writeFileSync(configPath, variantConfig(canonical, variant.layers), 'utf8');
      const result = await sync(c.worldDir);
      assert.ok(
        !result.diagnostics.some(d => d.severity === 'error'),
        `${variant.key} syncs without errors`
      );
      const styles = fs.readFileSync(
        path.join(c.worldDir, '.reference-ui', 'styled', 'styles.css'),
        'utf8'
      );
      assertSheet(styles, variant);
      await page.goto(`${url}?variant=${variant.key}`, { waitUntil: 'load' });
      await assertProbes(page, variant);
    }
  } finally {
    fs.writeFileSync(configPath, canonical, 'utf8');
    await sync(c.worldDir);
  }
}
