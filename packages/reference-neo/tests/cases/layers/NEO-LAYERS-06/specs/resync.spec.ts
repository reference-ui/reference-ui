// resync.spec.ts — spec for NEO-LAYERS-06, the re-sync case. Takes { page, url,
// case } with the consumer world synced standalone. Each of four legs (layers or
// extends, wired by a relative or a bare import) syncs the upstream, wires the
// consumer, edits the upstream's ink in its theme, re-syncs both in this process,
// and asserts the new value in the served sheet and the computed colour. Emits
// nothing when every leg lands; throws listing each leg that kept the old value.
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

type Bucket = 'layers' | 'extends';
type Spelling = 'relative' | 'bare';

interface Leg {
  bucket: Bucket;
  spelling: Spelling;
}

interface Upstream {
  dir: string;
  tokensPath: string;
  tokensCanonical: string;
}

// Both buckets under both spellings. The bare spelling is a package specifier, the
// way a real consumer imports `@reference-ui/icons/baseSystem`.
const LEGS: readonly Leg[] = [
  { bucket: 'layers', spelling: 'relative' },
  { bucket: 'extends', spelling: 'relative' },
  { bucket: 'layers', spelling: 'bare' },
  { bucket: 'extends', spelling: 'bare' },
];

const UP = 'neo-layers6-up';
const NEO_IMPORT = "import { defineConfig } from '@reference-ui/neo'";
const UP_BASE = '../upstreams/up/.reference-ui/system/baseSystem.mjs';
const RELATIVE_IMPORT = `import { baseSystem as upBaseSystem } from '${UP_BASE}'`;
const BARE_IMPORT = `import { baseSystem as upBaseSystem } from '${UP}/baseSystem'`;
const INK_V1 = '#be185d';
const INK_V2 = '#0f766e';
const RGB_V1 = 'rgb(190, 24, 93)';
const RGB_V2 = 'rgb(15, 118, 110)';

function inkDecl(ink: string): string {
  return `--colors-up-ink: ${ink}`;
}

function sheetOf(worldDir: string): string {
  const file = path.join(worldDir, '.reference-ui', 'styled', 'styles.css');
  return fs.readFileSync(file, 'utf8');
}

function publishedTextOf(upDir: string): string {
  const file = path.join(upDir, '.reference-ui', 'system', 'baseSystem.mjs');
  return fs.readFileSync(file, 'utf8');
}

function legTag(leg: Leg): string {
  return `${leg.bucket}/${leg.spelling}`;
}

function wiringFor(leg: Leg): string {
  if (leg.bucket === 'layers') return 'extends: [],\n  layers: [upBaseSystem],';
  return 'extends: [upBaseSystem],';
}

// The canonical config imports nothing and extends nothing. Each leg adds one
// import and wires the upstream into one bucket.
function legConfig(canonical: string, leg: Leg): string {
  const importLine = leg.spelling === 'bare' ? BARE_IMPORT : RELATIVE_IMPORT;
  const withImport = canonical.replace(NEO_IMPORT, `${NEO_IMPORT}\n${importLine}`);
  if (withImport === canonical) {
    throw new Error('canonical ui.config lost its neo import');
  }
  const wired = withImport.replace('extends: [],', wiringFor(leg));
  if (wired === withImport) {
    throw new Error('canonical ui.config lost its empty extends');
  }
  return wired;
}

// Edits the upstream's ink in its theme and syncs the upstream for real. The
// upstream must publish the new value before the consumer is re-synced, so a stale
// consumer below is never confused with a stale upstream.
async function setUpstreamInk(up: Upstream, ink: string): Promise<void> {
  if (!up.tokensCanonical.includes(INK_V1)) {
    throw new Error('canonical upstream tokens lost the v1 ink');
  }
  fs.writeFileSync(up.tokensPath, up.tokensCanonical.replace(INK_V1, ink), 'utf8');
  await sync(up.dir);
  const published = publishedTextOf(up.dir).includes(inkDecl(ink));
  assert.ok(published, `upstream publishes ${inkDecl(ink)}`);
}

// The bare specifier resolves through node_modules, the way a consumer's workspace
// link resolves. The link is made per leg and removed in that leg's finally.
function linkBareUpstream(worldDir: string, upDir: string): string {
  const link = path.join(worldDir, 'node_modules', UP);
  fs.mkdirSync(path.dirname(link), { recursive: true });
  fs.rmSync(link, { force: true });
  fs.symlinkSync(path.relative(path.dirname(link), upDir), link, 'dir');
  return link;
}

async function assertPaint(
  page: SpecPage,
  url: string,
  tag: string,
  rgb: string,
): Promise<void> {
  await page.goto(`${url}?leg=${tag}`, { waitUntil: 'load' });
  const probe = page.locator('#probe');
  await probe.waitFor();
  const color = await probe.evaluate((el) => getComputedStyle(el).color);
  assert.equal(color, rgb, `probe paints the upstream ink (${tag})`);
}

// The consumer sheet after a re-sync must carry the new ink. The upstream has
// already published it, so a sheet still holding the old ink means the consumer's
// config load kept the upstream it read on the first sync.
function assertResynced(worldDir: string, tag: string): void {
  const sheet = sheetOf(worldDir);
  const detail = sheet.includes(inkDecl(INK_V1))
    ? 'it still carries the old value'
    : 'it carries neither value';
  const landed = sheet.includes(inkDecl(INK_V2));
  assert.ok(landed, `${tag}: re-sync sheet lacks ${inkDecl(INK_V2)} (${detail})`);
}

async function runLeg(
  input: SpecInput,
  up: Upstream,
  canonical: string,
  leg: Leg,
): Promise<void> {
  const { page, url, case: c } = input;
  const tag = legTag(leg);
  const configPath = path.join(c.worldDir, 'ui.config.ts');
  const link = leg.spelling === 'bare' ? linkBareUpstream(c.worldDir, up.dir) : null;
  try {
    fs.writeFileSync(configPath, legConfig(canonical, leg), 'utf8');
    await sync(c.worldDir);
    const first = sheetOf(c.worldDir).includes(inkDecl(INK_V1));
    assert.ok(first, `${tag}: first sync carries ${inkDecl(INK_V1)}`);
    await assertPaint(page, url, `${tag}-v1`, RGB_V1);

    await setUpstreamInk(up, INK_V2);
    await sync(c.worldDir);
    assertResynced(c.worldDir, tag);
    await assertPaint(page, url, `${tag}-v2`, RGB_V2);
  } finally {
    fs.writeFileSync(configPath, canonical, 'utf8');
    await sync(c.worldDir);
    if (link !== null) fs.rmSync(link, { force: true });
    fs.writeFileSync(up.tokensPath, up.tokensCanonical, 'utf8');
    await sync(up.dir);
  }
}

// Syncs the upstream for real, then runs every leg. A failing leg is recorded and
// the next one still runs, so each spelling reports its own verdict. The tree is
// restored per leg, so the run ends canonical whatever a leg does.
export default async function run(input: SpecInput): Promise<void> {
  const upDir = path.join(input.case.dir, 'upstreams', 'up');
  const tokensPath = path.join(upDir, 'theme', 'tokens.ts');
  const up: Upstream = {
    dir: upDir,
    tokensPath,
    tokensCanonical: fs.readFileSync(tokensPath, 'utf8'),
  };
  const configPath = path.join(input.case.worldDir, 'ui.config.ts');
  const canonical = fs.readFileSync(configPath, 'utf8');
  await sync(upDir);
  const published = publishedTextOf(upDir).includes(inkDecl(INK_V1));
  assert.ok(published, `upstream publishes ${inkDecl(INK_V1)}`);
  const failed: string[] = [];
  for (const leg of LEGS) {
    try {
      await runLeg(input, up, canonical, leg);
    } catch (err) {
      failed.push(err instanceof Error ? err.message : String(err));
    }
  }
  if (failed.length > 0) throw new Error(failed.join('\n'));
}
