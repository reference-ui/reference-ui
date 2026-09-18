// authoring.spec.ts — spec for NEO-SYNC-12, the system authoring case. Takes
// { case } from the runner with the world freshly synced and asserts node-side.
// Emits nothing on success; throws naming the missing authoring export or the
// getRhythm value that drifts from the compiled sheet on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

interface SystemEntry {
  defineConfig: (config: Record<string, unknown>) => Record<string, unknown>;
  tokens: (config: unknown) => void;
  font: (name: string, options: unknown) => void;
  keyframes: (config: unknown) => void;
  globalCss: (config: unknown) => void;
  extendPattern: (extension: unknown) => void;
  getRhythm: (num: number, denom?: number) => string;
  baseSystem: { name: string; schemaVersion: number };
}

// The runner synced this world before serving: the system entry imports
// node-side with the D6 authoring surface, and getRhythm(4) equals the calc
// the engine emitted for the 4r padding want in the styled sheet.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const systemPath = path.join(outDir, 'system', 'system.mjs');
  assert.ok(fs.existsSync(systemPath), 'synced folder carries system/system.mjs');
  assert.ok(
    fs.existsSync(path.join(outDir, 'system', 'system.d.mts')),
    'synced folder carries system/system.d.mts',
  );

  const mod = (await import(pathToFileURL(systemPath).href)) as unknown as SystemEntry;
  for (const name of [
    'defineConfig',
    'tokens',
    'font',
    'keyframes',
    'globalCss',
    'extendPattern',
    'getRhythm',
  ] as const) {
    assert.equal(typeof mod[name], 'function', `system entry exports ${name}`);
  }
  assert.equal(typeof mod.baseSystem, 'object', 'system entry re-exports baseSystem');
  assert.equal(mod.baseSystem.name, 'neo-sync12', 're-exported baseSystem names the system');

  const baseMod = (await import(
    pathToFileURL(path.join(outDir, 'system', 'baseSystem.mjs')).href
  )) as unknown as { baseSystem: { name: string } };
  assert.deepEqual(mod.baseSystem, baseMod.baseSystem, 'system re-export matches baseSystem.mjs');

  const cfg = { name: 'x', include: [] as string[] };
  assert.equal(mod.defineConfig(cfg), cfg, 'defineConfig is the identity helper');

  assert.equal(mod.getRhythm(4), 'calc(4 * var(--spacing-root))', 'getRhythm(4) is the compiled root calc');
  assert.equal(mod.getRhythm(1), 'var(--spacing-root)', 'getRhythm(1) is the bare root var');
  assert.equal(
    mod.getRhythm(1, 2),
    'calc(var(--spacing-root) / 2)',
    'getRhythm(1, 2) splits the root',
  );

  const sheet = fs.readFileSync(path.join(outDir, 'styled', 'styles.css'), 'utf8');
  assert.ok(
    sheet.includes(mod.getRhythm(4)),
    `sheet uses the getRhythm(4) calc, got ${sheet.slice(0, 200)}`,
  );
  assert.ok(sheet.includes('neo-sync12__p_4r'), 'sheet carries the 4r utility');

  const pkg = JSON.parse(
    fs.readFileSync(path.join(outDir, 'system', 'package.json'), 'utf8'),
  ) as { main?: string; types?: string; exports?: Record<string, unknown> };
  assert.equal(pkg.main, './system.mjs', 'system package main is system.mjs');
  assert.equal(pkg.types, './system.d.mts', 'system package types is system.d.mts');
  assert.deepEqual(
    pkg.exports?.['.'],
    { types: './system.d.mts', import: './system.mjs' },
    'system exports map pins the D6 entry filenames',
  );
  assert.deepEqual(
    pkg.exports?.['./baseSystem'],
    { types: './baseSystem.d.mts', import: './baseSystem.mjs' },
    'system exports map keeps ./baseSystem',
  );

  const decl = fs.readFileSync(path.join(outDir, 'system', 'system.d.mts'), 'utf8');
  for (const name of ['defineConfig', 'tokens', 'font', 'keyframes', 'globalCss', 'extendPattern', 'getRhythm', 'baseSystem']) {
    assert.ok(decl.includes(name), `system.d.mts declares ${name}`);
  }

  const probe = (await import(
    pathToFileURL(path.join(c.worldDir, 'resolve-from-world.mjs')).href
  )) as unknown as { resolve: (specifier: string) => string };
  const bare = fs.realpathSync(fileURLToPath(probe.resolve('@reference-ui/system')));
  assert.equal(
    bare,
    fs.realpathSync(systemPath),
    `@reference-ui/system resolves to system.mjs, got ${bare}`,
  );
  const bareMod = (await import(pathToFileURL(bare).href)) as unknown as SystemEntry;
  assert.equal(
    bareMod.getRhythm(4),
    'calc(4 * var(--spacing-root))',
    'bare-specifier getRhythm(4) matches the sheet calc',
  );
}
