// portable.spec.ts — spec for NEO-SYNC-03, the portable base system case. Takes
// { case } from the runner with the world freshly synced and asserts node-side.
// Emits nothing on success; throws naming the contract field that drifts from
// the frozen PortableBaseSystem shape on failure.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

interface PortableFragment {
  source: string;
  code: string;
}

interface PortableCssChunk {
  system: string;
  hash: string;
  css: string;
}

interface RuntimeArtifact {
  schemaVersion: number;
  namer: {
    rulesVersion: number;
    aliases: Record<string, string>;
    breakpoints: string[];
    conditions: string[];
  };
  recipes: Record<string, unknown>;
  stylePropNames: string[];
}

interface PortableBaseSystem {
  schemaVersion: number;
  name: string;
  fragments: PortableFragment[];
  cssChunks: PortableCssChunk[];
  runtime: RuntimeArtifact;
  jsxElements: string[];
}

// The runner synced this world before serving: the base system imports as a
// PortableBaseSystem with source-tagged fragments, a hashed css chunk, the
// compiled runtime backfilled from the native compile, and merged jsx hosts.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const mod = (await import(
    pathToFileURL(path.join(outDir, 'system', 'baseSystem.mjs')).href
  )) as unknown as { baseSystem: PortableBaseSystem & Record<string, unknown> };
  const base = mod.baseSystem;

  assert.equal(base.schemaVersion, 1, 'baseSystem carries schemaVersion 1');
  assert.equal(base.name, 'neo-sync3', `baseSystem names the system, got ${base.name}`);
  assert.ok(!('fragment' in base), 'no flattened fragment survivor');
  assert.ok(!('css' in base), 'no flattened css survivor');

  assert.ok(Array.isArray(base.fragments), 'fragments is an array');
  assert.ok(base.fragments.length >= 1, `fragments carries the bundle, got ${base.fragments.length}`);
  for (const fragment of base.fragments) {
    assert.equal(typeof fragment.source, 'string', 'fragment source is tagged');
    assert.ok(fragment.source.length > 0, 'fragment source is non-empty');
    assert.equal(typeof fragment.code, 'string', 'fragment code is a string');
  }
  assert.ok(
    base.fragments.some((fragment) => fragment.code.includes('brand')),
    'fragment bundle carries the token source',
  );

  assert.ok(Array.isArray(base.cssChunks), 'cssChunks is an array');
  assert.equal(base.cssChunks.length, 1, `one css chunk, got ${base.cssChunks.length}`);
  const chunk = base.cssChunks[0] as PortableCssChunk;
  assert.equal(chunk.system, 'neo-sync3', `chunk names the system, got ${chunk.system}`);
  assert.match(chunk.hash, /^[0-9a-f]{16}$/, `chunk hash is 16 hex, got ${chunk.hash}`);
  const expectedHash = crypto.createHash('sha256').update(chunk.css, 'utf8').digest('hex').slice(0, 16);
  assert.equal(chunk.hash, expectedHash, 'chunk hash covers the chunk css');
  assert.ok(chunk.css.includes('--colors-brand: #7c3aed'), 'chunk css carries the token var');
  const portableSheet = fs.readFileSync(path.join(outDir, 'styled', 'styles.css'), 'utf8');
  assert.ok(portableSheet.includes('--colors-brand: #7c3aed'), 'styled sheet carries the token var');

  assert.equal(base.runtime.schemaVersion, 2, 'runtime carries schemaVersion 2');
  assert.ok(!('stylePlans' in base.runtime), 'runtime carries no per-atom row');
  assert.ok(base.runtime.namer, 'runtime carries the namer tables');
  assert.equal(typeof base.runtime.namer.rulesVersion, 'number', 'namer tables carry a rules version');
  assert.ok(
    base.runtime.namer.breakpoints.includes('base'),
    'namer tables carry the breakpoint scale',
  );
  assert.ok(
    base.runtime.namer.conditions.length > 0,
    'namer tables carry the known conditions',
  );
  assert.ok(
    base.runtime.stylePropNames.includes('color'),
    `stylePropNames carries color, got ${base.runtime.stylePropNames.join(', ')}`,
  );
  const dataMod = (await import(
    pathToFileURL(path.join(outDir, 'styled', 'runtime-data.mjs')).href
  )) as unknown as { runtimeData: RuntimeArtifact };
  assert.deepEqual(base.runtime, dataMod.runtimeData, 'base runtime equals the styled runtime data');

  assert.deepEqual(base.jsxElements, [], `jsxElements merges hosts, got ${base.jsxElements.join(', ')}`);

  const decl = fs.readFileSync(path.join(outDir, 'system', 'baseSystem.d.mts'), 'utf8');
  assert.ok(decl.includes('PortableBaseSystem'), 'baseSystem.d.mts declares the portable type');
  assert.ok(!decl.includes('fragment: string'), 'baseSystem.d.mts drops the flattened field');
}
