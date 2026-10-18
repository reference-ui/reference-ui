// relations.spec.ts — spec for CORE-LAYERS-14, the relation rejections at config load.
// It takes { case } with the consumer world synced by the runner, syncs three upstreams for
// real (a twin named as the consumer, a plain b, and a cycle extending the world's published
// system), then drives the spawned bin over each bad relation in the world config. Each
// rejected sync must exit 1 with its named message and leave the published system untouched,
// and a never-synced package must give the sync hint. The world and cycle configs are restored
// in a finally. Emits nothing on success; throws naming the failed assertion on failure.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CoreCase } from '../../../../shared/cases.ts';
import { sync } from '../../../../../src/sync/index.ts';

interface SpecInput {
  case: CoreCase;
}

interface PublishedBaseSystem {
  name: string;
  streams?: Array<{ name: string }>;
}

interface Leg {
  label: string;
  imports: string[];
  fields: string;
  message: string;
}

const BIN_PATH = fileURLToPath(new URL('../../../../../bin/ref.ts', import.meta.url));
const CONFIG_IMPORT = "import { defineConfig } from '@reference-ui/core'";
const EMPTY_EXTENDS = 'extends: [],';
const WORLD_NAME = 'core-layers14';
const B_NAME = 'core-layers14-b';
const CYCLE_NAME = 'core-layers14-cycle';
const UNSYNCED_PACKAGE = 'core-layers14-unsynced';
const LAYERS_HEADER = "Config field 'layers' is invalid.";
const EXTENDS_HEADER = "Config field 'extends' is invalid.";
const SYNC_FAILED = '[ref] sync failed: ';
const UPSTREAM_HINT =
  'This can happen when an upstream Reference UI package has not been synced. Run sync on the upstream package first.';

const TWIN_IMPORT = upstreamImport('twinUpstream', 'twin');
const B_IMPORT = upstreamImport('bUpstream', 'b');
const CYCLE_IMPORT = upstreamImport('cycleUpstream', 'cycle');
const WORLD_IMPORT =
  "import { baseSystem as worldUpstream } from '../../world/.reference-ui/system/baseSystem.mjs'";
const UNSYNCED_IMPORT = `import { baseSystem as unsyncedUpstream } from '${UNSYNCED_PACKAGE}/system'`;

// A published base system imported by its path under upstreams/<dir>.
function upstreamImport(ident: string, dir: string): string {
  return `import { baseSystem as ${ident} } from '../upstreams/${dir}/.reference-ui/system/baseSystem.mjs'`;
}

// The reason line when an entry reaches the config's own name, for the entry at index 0.
function ownNameReach(entry: string): string {
  return `Entry 0 (${entry}) reaches '${WORLD_NAME}', this config's own name, so the config would be its own upstream. Remove the entry, or cut the path from its extends and layers back to '${WORLD_NAME}'.`;
}

// Each bad relation: the imports it needs, the extends or layers lines it writes, and the message.
const LEGS: Leg[] = [
  {
    label: 'streamless layers entry',
    imports: [],
    fields: "extends: [],\n  layers: [{ name: 'core-layers14-tokens', fragment: 'fragment-code' }],",
    message: `${LAYERS_HEADER}\nEntry 0 (core-layers14-tokens) must include 'streams'. A layers entry contributes CSS only through its streams, so a fragment or jsxElements alone would be silently dropped. Run sync on the upstream package first, or list it under 'extends' for its fragment and jsxElements.`,
  },
  {
    label: 'self-named entry',
    imports: [TWIN_IMPORT],
    fields: 'extends: [],\n  layers: [twinUpstream],',
    message: `${LAYERS_HEADER}\n${ownNameReach(WORLD_NAME)}`,
  },
  {
    label: 'A to B cycle',
    imports: [CYCLE_IMPORT],
    fields: 'extends: [],\n  layers: [cycleUpstream],',
    message: `${LAYERS_HEADER}\n${ownNameReach(CYCLE_NAME)}`,
  },
  {
    label: 'repeat within layers',
    imports: [B_IMPORT],
    fields: 'extends: [],\n  layers: [bUpstream, bUpstream],',
    message: `${LAYERS_HEADER}\nEntry 1 (${B_NAME}) repeats entry 0. List each system once.`,
  },
  {
    label: 'repeat within extends',
    imports: [B_IMPORT],
    fields: 'extends: [bUpstream, bUpstream],',
    message: `${EXTENDS_HEADER}\nEntry 1 (${B_NAME}) repeats entry 0. List each system once.`,
  },
  {
    label: 'system in both extends and layers',
    imports: [B_IMPORT],
    fields: 'extends: [bUpstream],\n  layers: [bUpstream],',
    message: `${LAYERS_HEADER}\nEntry 0 (${B_NAME}) is also listed under 'extends'. 'extends' already includes everything 'layers' gives, so remove it from 'layers'.`,
  },
];

// The never-synced leg imports an installed package whose published system was never generated.
const UNSYNCED_LEG: Leg = {
  label: 'never-synced upstream',
  imports: [UNSYNCED_IMPORT],
  fields: 'extends: [],\n  layers: [unsyncedUpstream],',
  message: '',
};

// Swaps one anchor for its replacement; a missing anchor means the canonical config changed shape.
// The check is on the anchor, not the text: a replacement may legitimately repeat the anchor.
function swapAnchor(text: string, anchor: string, replacement: string): string {
  if (!text.includes(anchor)) throw new Error(`canonical ui.config lost its anchor: ${anchor}`);
  return text.replace(anchor, replacement);
}

// The world config for one leg: its imports after the defineConfig import, its fields in place of the empty extends.
function legConfig(canonical: string, leg: Leg): string {
  const withImports = swapAnchor(
    canonical,
    CONFIG_IMPORT,
    [CONFIG_IMPORT, ...leg.imports].join('\n')
  );
  return swapAnchor(withImports, EMPTY_EXTENDS, leg.fields);
}

// The cycle upstream extends the world's published system, so its streams carry the consumer name.
function cycleExtendsWorld(canonical: string): string {
  const withImport = swapAnchor(canonical, CONFIG_IMPORT, [CONFIG_IMPORT, WORLD_IMPORT].join('\n'));
  return swapAnchor(withImport, EMPTY_EXTENDS, 'extends: [worldUpstream],');
}

function upstreamDir(c: CoreCase, dir: string): string {
  return path.join(c.dir, 'upstreams', dir);
}

function readPublishedText(root: string): string {
  return fs.readFileSync(path.join(root, '.reference-ui', 'system', 'baseSystem.mjs'), 'utf8');
}

function readPublished(root: string): PublishedBaseSystem {
  const raw = readPublishedText(root);
  return JSON.parse(raw.slice(raw.indexOf('{'))) as PublishedBaseSystem;
}

function streamNames(system: PublishedBaseSystem): string[] {
  return (system.streams ?? []).map((stream) => stream.name);
}

// Syncs one upstream for real and checks the name it publishes.
async function syncUpstream(dir: string, name: string): Promise<PublishedBaseSystem> {
  await sync(dir);
  const published = readPublished(dir);
  assert.equal(published.name, name, `${dir} publishes its name`);
  return published;
}

// Syncs the three upstreams for real. The cycle is written to extend the world first, so the
// consumer name rides its streams.
async function syncFixtures(c: CoreCase, cycleConfig: string, cycleCanonical: string): Promise<void> {
  await syncUpstream(upstreamDir(c, 'twin'), WORLD_NAME);
  await syncUpstream(upstreamDir(c, 'b'), B_NAME);
  fs.writeFileSync(cycleConfig, cycleExtendsWorld(cycleCanonical), 'utf8');
  const cycle = await syncUpstream(upstreamDir(c, 'cycle'), CYCLE_NAME);
  assert.ok(
    streamNames(cycle).includes(WORLD_NAME),
    'the cycle upstream reaches the consumer name through its streams'
  );
}

function runBin(dir: string) {
  return spawnSync(process.execPath, [BIN_PATH, 'sync', dir], { cwd: dir, encoding: 'utf8' });
}

// A rejected relation exits 1 with its named message and leaves the published system untouched.
function proveRejects(worldDir: string, leg: Leg, publishedBefore: string): void {
  const result = runBin(worldDir);
  assert.equal(result.status, 1, `${leg.label} exits 1`);
  assert.ok(
    result.stdout.includes(`${SYNC_FAILED}${leg.message}`),
    `${leg.label} prints its named message, got: ${result.stdout}`
  );
  assert.equal(
    readPublishedText(worldDir),
    publishedBefore,
    `${leg.label} leaves the published system untouched`
  );
}

// An installed package whose exports name a published system that was never synced.
function makeUnsyncedPackage(worldDir: string): string {
  const pkgDir = path.join(worldDir, 'node_modules', UNSYNCED_PACKAGE);
  fs.mkdirSync(pkgDir, { recursive: true });
  fs.writeFileSync(
    path.join(pkgDir, 'package.json'),
    JSON.stringify(
      {
        name: UNSYNCED_PACKAGE,
        version: '0.0.0',
        type: 'module',
        exports: { './system': './.reference-ui/system/baseSystem.mjs' },
      },
      null,
      2
    )
  );
  return pkgDir;
}

function removeUnsyncedPackage(worldDir: string): void {
  fs.rmSync(path.join(worldDir, 'node_modules', UNSYNCED_PACKAGE), { recursive: true, force: true });
  try {
    fs.rmdirSync(path.join(worldDir, 'node_modules'));
  } catch {
    // Not empty, or already gone: another install still owns the folder.
  }
}

// An upstream that was never synced gives the load error with the sync hint.
function proveUnsyncedHint(worldDir: string): void {
  const pkgDir = makeUnsyncedPackage(worldDir);
  try {
    assert.ok(
      !fs.existsSync(path.join(pkgDir, '.reference-ui')),
      'the unsynced package has no published system'
    );
    const result = runBin(worldDir);
    assert.equal(result.status, 1, 'the unsynced upstream exits 1');
    assert.ok(
      result.stdout.includes(`${SYNC_FAILED}reference-ui: Failed to load `),
      `the unsynced upstream fails to load, got: ${result.stdout}`
    );
    assert.ok(result.stdout.includes(UPSTREAM_HINT), 'the load error carries the sync hint');
  } finally {
    removeUnsyncedPackage(worldDir);
  }
}

// The world rejects each bad relation through the bin, the unsynced upstream gives the hint, and
// the canonical world and cycle configs are restored after every run.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const worldConfig = path.join(c.worldDir, 'ui.config.ts');
  const worldCanonical = fs.readFileSync(worldConfig, 'utf8');
  const cycleConfig = path.join(upstreamDir(c, 'cycle'), 'ui.config.ts');
  const cycleCanonical = fs.readFileSync(cycleConfig, 'utf8');
  const publishedBefore = readPublishedText(c.worldDir);

  try {
    await syncFixtures(c, cycleConfig, cycleCanonical);
    for (const leg of LEGS) {
      fs.writeFileSync(worldConfig, legConfig(worldCanonical, leg), 'utf8');
      proveRejects(c.worldDir, leg, publishedBefore);
    }
    fs.writeFileSync(worldConfig, legConfig(worldCanonical, UNSYNCED_LEG), 'utf8');
    proveUnsyncedHint(c.worldDir);
  } finally {
    fs.writeFileSync(worldConfig, worldCanonical, 'utf8');
    fs.writeFileSync(cycleConfig, cycleCanonical, 'utf8');
    await sync(upstreamDir(c, 'cycle'));
  }
}
