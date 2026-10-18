// loud-layers.spec.ts — spec for CORE-LAYERS-05, the invalid-layers case. It takes
// { case } from the runner with the valid world freshly synced, then drives sync()
// over bad and accepted configs in temp dirs and the spawned bin once. It emits
// nothing on success and throws naming the shape whose message or folder check failed.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CoreCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { flushReferenceBuild } from '../../../../../src/reference/bridge/init.ts';
import { sync } from '../../../../../src/sync/index.ts';

interface SpecInput {
  page: SpecPage;
  case: CoreCase;
}

interface BadShape {
  label: string;
  layers: string;
  message: string;
}

interface AcceptedShape {
  label: string;
  fields: string;
}

const BIN_PATH = fileURLToPath(new URL('../../../../../bin/ref.ts', import.meta.url));
const LAYERS_HEADER = "Config field 'layers' is invalid.";
const EXTENDS_HEADER = "Config field 'extends' is invalid.";
const NAME_REASON = "Entry 0 must have a non-empty 'name'.";
const NAMED_SYNCED_ENTRY = "{ name: 'a', fragment: 'fragment-code', streams: [{ name: 'a', preamble: '' }] }";

// The reason line for a layers entry that carries no synced payload, at the given label.
function unsyncedReason(entry: string): string {
  return [
    `${entry} must include synced system data (fragment, streams, or jsxElements).`,
    'Run sync on the upstream package first.',
  ].join(' ');
}

// The reason line for a layers entry with synced data but no streams, at the given label.
function streamlessReason(entry: string): string {
  return [
    `${entry} must include 'streams'.`,
    'A layers entry contributes CSS only through its streams, so a fragment or jsxElements alone would be silently dropped.',
    "Run sync on the upstream package first, or list it under 'extends' for its fragment and jsxElements.",
  ].join(' ');
}

// One bad layers shape: the literal spelled into the config and the full message.
function badShape(label: string, layers: string, reason: string): BadShape {
  return { label, layers, message: `${LAYERS_HEADER}\n${reason}` };
}

const BAD_SHAPES: BadShape[] = [
  badShape('object instead of array', '{}', 'Expected an array of BaseSystem objects.'),
  badShape('null entry', '[null]', 'Entry 0 must be an object.'),
  badShape('entry without name', "[{ fragment: 'x' }]", NAME_REASON),
  badShape('whitespace-only name', "[{ name: '   ', fragment: 'x' }]", NAME_REASON),
  badShape(
    'entry without synced data',
    "[{ name: 'icons' }]",
    unsyncedReason('Entry 0 (icons)'),
  ),
  badShape(
    'empty fragment and streams',
    "[{ name: 'icons', fragment: '', streams: [] }]",
    unsyncedReason('Entry 0 (icons)'),
  ),
  badShape(
    'bad second entry names its index',
    `[${NAMED_SYNCED_ENTRY}, { name: 'b' }]`,
    unsyncedReason('Entry 1 (b)'),
  ),
  badShape(
    'fragment-only entry without streams',
    "[{ name: 'tokens', fragment: 'x' }]",
    streamlessReason('Entry 0 (tokens)'),
  ),
];

// Both bad fields are reported together, extends first, joined by a blank line.
const PRECEDENCE_FIELDS = '  extends: [null],\n  layers: {},';
const PRECEDENCE_MESSAGE = [
  `${EXTENDS_HEADER}\nEntry 0 must be an object.`,
  `${LAYERS_HEADER}\nExpected an array of BaseSystem objects.`,
].join('\n\n');

// Accepted shapes: omitted layers and an empty array both sync and land the folder.
const ACCEPTED_SHAPES: AcceptedShape[] = [
  { label: 'layers omitted', fields: '' },
  { label: 'layers empty array', fields: '  layers: [],' },
];

// A full ui.config.ts around the given field lines, with the world's name and include.
function configFile(fields: string): string {
  return [
    "import { defineConfig } from '@reference-ui/core'",
    '',
    'export default defineConfig({',
    "  name: 'core-layers5',",
    "  include: ['theme/**/*.{ts,tsx}'],",
    fields,
    '})',
    '',
  ].join('\n');
}

// Writes one config into a fresh temp dir; the caller removes the dir.
function writeWorld(config: string): string {
  const dir = fs.mkdtempSync(path.join(tmpdir(), 'core-layers5-'));
  fs.writeFileSync(path.join(dir, 'ui.config.ts'), config);
  return dir;
}

function removeWorld(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

function hasGeneratedFolder(dir: string): boolean {
  return fs.existsSync(path.join(dir, '.reference-ui'));
}

// A rejected config carries the exact message and leaves no generated folder behind.
async function proveRejects(
  label: string,
  config: string,
  message: string,
): Promise<void> {
  const dir = writeWorld(config);
  try {
    await assert.rejects(
      sync(dir),
      { message },
      `${label} fails sync with the documented message`,
    );
    assert.ok(!hasGeneratedFolder(dir), `${label} leaves no folder behind`);
  } finally {
    removeWorld(dir);
  }
}

// An accepted config resolves and lands the generated folder. A successful in-process
// sync schedules a background reference build, so the flush drains it before cleanup.
async function proveAccepts(label: string, config: string): Promise<void> {
  const dir = writeWorld(config);
  try {
    await sync(dir);
    const build = await flushReferenceBuild(dir);
    assert.notEqual(build?.status, 'failed', `${label} reference build does not fail`);
    assert.ok(hasGeneratedFolder(dir), `${label} syncs and lands the generated folder`);
  } finally {
    removeWorld(dir);
  }
}

// The spawned bin prints the same header and reason on stdout, then exits 1.
function proveCliFailsLoud(): void {
  const dir = writeWorld(configFile('  layers: {},'));
  try {
    const result = spawnSync(process.execPath, [BIN_PATH, 'sync', dir], {
      cwd: dir,
      encoding: 'utf8',
    });
    const expected = [
      `[ref] sync failed: ${LAYERS_HEADER}`,
      'Expected an array of BaseSystem objects.',
    ].join('\n');
    assert.equal(result.status, 1, 'ref sync exits 1 on an invalid layers config');
    assert.ok(
      result.stdout.includes(expected),
      `ref sync prints the documented message, got: ${result.stdout}`,
    );
    assert.ok(!hasGeneratedFolder(dir), 'ref sync leaves no folder behind');
  } finally {
    removeWorld(dir);
  }
}

// The runner synced this world (layers: []), so its sheet must carry the brand token.
function proveWorldSheet(worldDir: string): void {
  const sheet = path.join(worldDir, '.reference-ui', 'styled', 'styles.css');
  assert.ok(
    fs.existsSync(sheet),
    'the valid world with layers: [] syncs and lands its sheet',
  );
  assert.ok(
    fs.readFileSync(sheet, 'utf8').includes('--colors-brand: #7c3aed'),
    'the world sheet carries the brand token',
  );
}

// The runner synced the valid world before serving. Every bad shape rejects with its
// message and leaves no folder, a bad extends and a bad layers are reported together with
// extends first, the accepted shapes land a folder, and the bin prints the same line and
// exits 1.
export default async function run({ case: c }: SpecInput): Promise<void> {
  proveWorldSheet(c.worldDir);
  for (const bad of BAD_SHAPES) {
    await proveRejects(bad.label, configFile(`  layers: ${bad.layers},`), bad.message);
  }
  await proveRejects(
    'both bad fields reported, extends first',
    configFile(PRECEDENCE_FIELDS),
    PRECEDENCE_MESSAGE,
  );
  for (const ok of ACCEPTED_SHAPES) {
    await proveAccepts(ok.label, configFile(ok.fields));
  }
  proveCliFailsLoud();
}
