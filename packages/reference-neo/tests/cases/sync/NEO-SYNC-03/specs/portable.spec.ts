// portable.spec.ts — spec for NEO-SYNC-03, the portable base system case. Takes
// { case } from the runner with the world freshly synced and asserts node-side.
// Emits nothing on success; throws naming the contract field that drifts from
// the singular BaseSystem shape on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

interface PublishedBaseSystem {
  name: string;
  fragment: string;
  streams?: unknown[];
  jsxElements?: string[];
}

// The runner synced this world before serving: the base system imports as the
// singular BaseSystem shape the extends validator and reader consume — name,
// the bundled fragment string, the structured streams payload, and merged jsx
// hosts. No plural write-only keys survive: fragments[], cssChunks[], and runtime
// were cut at the publish boundary (the styled leg owns the runtime data).
// S4 transient: sync still runs the packed merge so no streams ride yet — S5
// fills carriage. `css` stays dead forever: its absence is permanent, the
// streams absence is not.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const mod = (await import(
    pathToFileURL(path.join(outDir, 'system', 'baseSystem.mjs')).href
  )) as unknown as { baseSystem: PublishedBaseSystem & Record<string, unknown> };
  const base = mod.baseSystem;

  assert.equal(base.name, 'neo-sync3', `baseSystem names the system, got ${base.name}`);
  assert.equal(typeof base.fragment, 'string', 'baseSystem carries the singular fragment string');
  assert.ok(base.fragment.length > 0, 'fragment bundle is non-empty');
  assert.ok(
    base.fragment.includes('brand'),
    'fragment bundle carries the token source',
  );
  assert.ok(!('css' in base), 'baseSystem drops the dead css field forever');
  assert.ok(!('streams' in base), 'S4 transient: S5 fills streams carriage');
  assert.deepEqual(base.jsxElements, [], `jsxElements merges hosts, got ${base.jsxElements?.join(', ')}`);

  assert.ok(!('fragments' in base), 'no plural fragments survivor');
  assert.ok(!('cssChunks' in base), 'no plural cssChunks survivor');
  assert.ok(!('runtime' in base), 'no duplicated runtime survivor');
  assert.ok(!('schemaVersion' in base), 'no schemaVersion survivor');

  const portableSheet = fs.readFileSync(path.join(outDir, 'styled', 'styles.css'), 'utf8');
  assert.ok(portableSheet.includes('--colors-brand: #7c3aed'), 'styled sheet carries the token var');

  const decl = fs.readFileSync(path.join(outDir, 'system', 'baseSystem.d.mts'), 'utf8');
  assert.ok(decl.includes('export interface BaseSystem'), 'baseSystem.d.mts declares BaseSystem');
  assert.ok(decl.includes('export interface SystemStreams'), 'baseSystem.d.mts declares SystemStreams');
  assert.ok(decl.includes('streams?: SystemStreams[]'), 'baseSystem.d.mts declares streams carriage');
  assert.ok(!decl.includes('css?'), 'baseSystem.d.mts drops the dead css field');
  assert.ok(decl.includes('fragment: string'), 'baseSystem.d.mts declares the singular fragment');
  assert.ok(!decl.includes('fragments:'), 'baseSystem.d.mts drops the plural field');
  assert.ok(!decl.includes('PortableBaseSystem'), 'baseSystem.d.mts drops the portable type');
}
