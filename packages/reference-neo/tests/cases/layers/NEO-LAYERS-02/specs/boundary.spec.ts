// boundary.spec.ts — spec for NEO-LAYERS-02, the visual-only boundary case. Takes {
// page, url, case } with the consumer world synced standalone. It syncs the up upstream
// for real, runs the consumer under layers and then under extends with the config
// rewritten between them, and restores the canonical config in a finally. Emits nothing
// on success; throws naming the failed assertion on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync, type SyncResult } from '../../../../../src/sync/index.ts';

interface SpecInput {
  page: SpecPage;
  url: string;
  case: NeoCase;
}

interface PublishedStream {
  utilities?: string;
  recipes?: string;
}

interface PublishedBaseSystem {
  name: string;
  fragment: string;
  jsxElements: string[];
  streams?: PublishedStream[];
}

interface EvaluatedSystem {
  tokens?: { colors?: Record<string, unknown> };
  recipes?: Record<string, unknown>;
}

interface JsxArtifact {
  upstream: string[];
  merged: string[];
}

interface Span {
  from: number;
  to: number;
}

const UP = 'neo-layers2-up';
const OWN = 'neo-layers2';
const STATEMENT = `@layer ${UP}, ${OWN};`;
const TOKEN = 'upInk';
const RECIPE = 'layBadge';
const UP_INK_RGB = 'rgb(190, 24, 93)';
const LAYER_WARNING = 'ATM-W-UNKNOWN-COLOR';
const CONFIG_IMPORT = "import { defineConfig } from '@reference-ui/neo'";
const UP_IMPORT = [
  'import { baseSystem as upUpstream } from',
  "  '../upstreams/up/.reference-ui/system/baseSystem.mjs'",
].join('\n');
const EMPTY_EXTENDS = 'extends: [],';

// Rule texts the upstream sync emits and the probes depend on; a renamed class fails loud.
const UP_TOKEN_VAR = '--colors-up-ink: #be185d;';
const UP_UTILITY = `.${UP}__c_${TOKEN} { color: var(--colors-up-ink); }`;
const UP_RECIPE = `.${UP}__${RECIPE}_s_lg { font-size: 20px; }`;
// The consumer's own rule for the probe: raw under layers, the token variable under extends.
const OWN_RAW_RULE = `.${OWN}__c_${TOKEN} { color: ${TOKEN}; }`;
const OWN_TOKEN_RULE = `.${OWN}__c_${TOKEN} { color: var(--colors-up-ink); }`;

function readGenerated(root: string, rel: string): string {
  return fs.readFileSync(path.join(root, '.reference-ui', rel), 'utf8');
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(readGenerated(root, rel)) as T;
}

// The published base system is `export const baseSystem = {...}`: parse from the first brace.
function readBaseSystem(root: string): PublishedBaseSystem {
  const raw = readGenerated(root, 'system/baseSystem.mjs');
  return JSON.parse(raw.slice(raw.indexOf('{'))) as PublishedBaseSystem;
}

function assertEmits(
  system: PublishedBaseSystem,
  field: keyof PublishedStream,
  rule: string
): void {
  const text = (system.streams ?? []).map(s => s[field] ?? '').join('\n');
  assert.ok(text.includes(rule), `${system.name} sync emits ${rule}`);
}

// Swaps one anchor for its replacement; a missing anchor means the canonical config changed shape.
function swapAnchor(text: string, anchor: string, replacement: string): string {
  const next = text.replace(anchor, replacement);
  if (next === text) throw new Error(`canonical ui.config lost its anchor: ${anchor}`);
  return next;
}

// Lists the up upstream in one bucket: extends replaces the empty list, layers sits beside it.
function toPhaseConfig(canonical: string, bucket: 'extends' | 'layers'): string {
  const withImport = swapAnchor(
    canonical,
    CONFIG_IMPORT,
    `${CONFIG_IMPORT}\n${UP_IMPORT}`
  );
  const entry =
    bucket === 'extends'
      ? 'extends: [upUpstream],'
      : 'extends: [],\n  layers: [upUpstream],';
  return swapAnchor(withImport, EMPTY_EXTENDS, entry);
}

// Under layers the consumer spec, roster, published fragment and typings hold no upstream surface.
function assertNoAuthoringSurface(root: string): void {
  const evaluated = readJson<EvaluatedSystem>(root, 'system/evaluated-system.json');
  assert.deepEqual(
    Object.keys(evaluated.tokens?.colors ?? {}),
    [],
    'layers add no tokens'
  );
  assert.deepEqual(Object.keys(evaluated.recipes ?? {}), [], 'layers add no recipes');
  const roster = readJson<JsxArtifact>(root, 'system/jsx-elements.json');
  assert.deepEqual(roster.upstream, [], 'layers add no upstream jsxElements');
  assert.ok(
    !roster.merged.includes('LayerCard'),
    'LayerCard stays out of the merged roster'
  );
  const system = readBaseSystem(root);
  assert.ok(
    !system.fragment.includes(TOKEN),
    'the published fragment carries no upstream token'
  );
  assert.deepEqual(
    system.jsxElements,
    [],
    'the published jsxElements carry no upstream roster'
  );
  const types = readGenerated(root, 'styled/types/index.d.ts');
  assert.ok(
    !types.includes(`'${TOKEN}'`),
    'typegen declares no ColorToken for the upstream token'
  );
  assert.ok(
    !types.includes('LayBadgeVariantProps'),
    'typegen declares no upstream recipe type'
  );
}

// Under extends the same artefacts gain the upstream token, the recipe and LayerCard.
function assertExtendsSurface(root: string): void {
  const evaluated = readJson<EvaluatedSystem>(root, 'system/evaluated-system.json');
  assert.ok(
    Object.keys(evaluated.tokens?.colors ?? {}).includes(TOKEN),
    'extends adopts the token'
  );
  assert.ok(
    Object.keys(evaluated.recipes ?? {}).includes(RECIPE),
    'extends adopts the recipe'
  );
  const roster = readJson<JsxArtifact>(root, 'system/jsx-elements.json');
  assert.deepEqual(roster.upstream, ['LayerCard'], 'extends adopts the upstream roster');
  assert.ok(roster.merged.includes('LayerCard'), 'LayerCard joins the merged roster');
  const system = readBaseSystem(root);
  assert.ok(
    system.fragment.includes(TOKEN),
    'the published fragment carries the upstream token'
  );
  assert.deepEqual(
    system.jsxElements,
    ['LayerCard'],
    'the published jsxElements carry the roster'
  );
  const types = readGenerated(root, 'styled/types/index.d.ts');
  assert.ok(
    types.includes(`'${TOKEN}'`),
    'typegen declares the upstream token in ColorToken'
  );
  assert.ok(
    types.includes('LayBadgeVariantProps'),
    'typegen declares the upstream recipe type'
  );
}

// A layer-only token is a warning at the consumer's call, never a sync failure.
function assertUnknownTokenWarning(result: SyncResult): void {
  assert.ok(
    !result.diagnostics.some(d => d.severity === 'error'),
    'the layer-only token is not a sync error'
  );
  const hits = result.diagnostics.filter(d => d.code === LAYER_WARNING);
  assert.equal(
    hits.length,
    1,
    `one ${LAYER_WARNING} warning under layers, got ${hits.length}`
  );
  assert.ok(
    hits[0].message.includes(TOKEN),
    `the warning names ${TOKEN}: ${hits[0].message}`
  );
  assert.ok(
    hits[0].file?.endsWith(path.join('src', 'app.ts')),
    `the warning points at the consumer call, got ${hits[0].file}`
  );
}

// The served sheet carries the statement, then the up block, then the own block.
function upBlockOf(styles: string): Span {
  assert.ok(styles.split('\n').includes(STATEMENT), `served sheet carries ${STATEMENT}`);
  const from = styles.indexOf(`@layer ${UP} {`);
  const to = styles.indexOf(`@layer ${OWN} {`);
  assert.ok(from >= 0 && from < to, 'the upstream block precedes the own block');
  return { from, to };
}

function assertInBlock(styles: string, rule: string, span: Span, what: string): void {
  const at = styles.indexOf(rule);
  assert.ok(
    at > span.from && at < span.to,
    `${what} carries ${rule} (at ${at}, block ${span.from}..${span.to})`
  );
}

function assertUpstreamBlock(styles: string): void {
  const up = upBlockOf(styles);
  assertInBlock(styles, UP_TOKEN_VAR, up, 'upstream block');
  assertInBlock(styles, UP_UTILITY, up, 'upstream block');
  assertInBlock(styles, UP_RECIPE, up, 'upstream block');
}

function ownBlockOf(styles: string): Span {
  return { from: styles.indexOf(`@layer ${OWN} {`), to: styles.length };
}

function assertLayersSheet(styles: string): void {
  assertUpstreamBlock(styles);
  assertInBlock(styles, OWN_RAW_RULE, ownBlockOf(styles), 'own block');
}

function assertExtendsSheet(styles: string): void {
  assertUpstreamBlock(styles);
  assertInBlock(styles, OWN_TOKEN_RULE, ownBlockOf(styles), 'own block');
}

async function colorOf(page: SpecPage, id: string): Promise<string> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  return node.evaluate(el => getComputedStyle(el).color);
}

async function fontSizeOf(page: SpecPage, id: string): Promise<string> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  return node.evaluate(el => getComputedStyle(el).fontSize);
}

// The probe must carry the class css() emitted, so a script that never ran cannot pass by inheritance.
async function assertProbeClass(page: SpecPage): Promise<void> {
  const node = page.locator('#token-probe');
  await node.waitFor();
  const cls = await node.evaluate(el => el.className);
  assert.equal(
    cls,
    `${OWN}__c_${TOKEN}`,
    `the token probe carries the class css() emitted: ${cls}`
  );
}

async function assertLayersPaints(page: SpecPage): Promise<void> {
  await assertProbeClass(page);
  const plain = await colorOf(page, 'plain');
  const token = await colorOf(page, 'token-probe');
  assert.equal(
    token,
    plain,
    `a layer-only token paints nothing: inherits ${plain}, got ${token}`
  );
  assert.equal(
    await colorOf(page, 'up-utility'),
    UP_INK_RGB,
    'the upstream utility paints'
  );
  assert.equal(await fontSizeOf(page, 'up-recipe'), '20px', 'the upstream recipe paints');
}

async function assertExtendsPaints(page: SpecPage): Promise<void> {
  await assertProbeClass(page);
  const token = await colorOf(page, 'token-probe');
  assert.equal(token, UP_INK_RGB, `extends adopts the token value, got ${token}`);
  assert.equal(
    await colorOf(page, 'up-utility'),
    UP_INK_RGB,
    'the upstream utility paints'
  );
}

// Syncs the upstream for real and checks the rules the probes depend on are what it emits.
async function syncUpstream(c: NeoCase): Promise<void> {
  const root = path.join(c.dir, 'upstreams', 'up');
  await sync(root);
  const published = readBaseSystem(root);
  assert.equal(published.name, UP, `upstream publishes its name, got ${published.name}`);
  assertEmits(published, 'utilities', UP_UTILITY);
  assertEmits(published, 'recipes', UP_RECIPE);
}

// Runs the consumer under layers, then under extends, against the same synced upstream.
export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  const configPath = path.join(c.worldDir, 'ui.config.ts');
  const canonical = fs.readFileSync(configPath, 'utf8');
  await syncUpstream(c);

  try {
    fs.writeFileSync(configPath, toPhaseConfig(canonical, 'layers'), 'utf8');
    const layered = await sync(c.worldDir);
    assertUnknownTokenWarning(layered);
    assertNoAuthoringSurface(c.worldDir);
    assertLayersSheet(readGenerated(c.worldDir, 'styled/styles.css'));
    await page.goto(`${url}?phase=layers`, { waitUntil: 'load' });
    await assertLayersPaints(page);

    fs.writeFileSync(configPath, toPhaseConfig(canonical, 'extends'), 'utf8');
    const extended = await sync(c.worldDir);
    assert.ok(
      !extended.diagnostics.some(d => d.code === LAYER_WARNING),
      'extends resolves the token with no layer warning'
    );
    assertExtendsSurface(c.worldDir);
    assertExtendsSheet(readGenerated(c.worldDir, 'styled/styles.css'));
    await page.goto(`${url}?phase=extends`, { waitUntil: 'load' });
    await assertExtendsPaints(page);
  } finally {
    fs.writeFileSync(configPath, canonical, 'utf8');
    await sync(c.worldDir);
  }
}
