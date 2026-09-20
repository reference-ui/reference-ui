// data-only.spec.ts — spec for NEO-SYNC-13, the styled data-only case. Takes
// { case } from the runner with the world freshly synced and asserts node-side.
// Emits nothing on success; throws naming the executable found in styled/ or
// the unbound css()/recipe() on failure.
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

interface ReactEntry {
  css: (styles: Record<string, unknown>) => string;
  recipe: (config: { className: string }) => (props?: Record<string, string>) => string;
}

// The runner synced this world before serving: styled/ carries data only
// (no executable module besides runtime-data.mjs), and the react entry
// exports css()/recipe() bound to this system's compiled plans.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const prefix = 'neo-sync13__';

  assert.ok(
    !fs.existsSync(path.join(outDir, 'styled', 'css.mjs')),
    'D4: styled/css.mjs is gone; the bound runtime lives in react',
  );
  const executables = fs
    .readdirSync(path.join(outDir, 'styled'))
    .filter((name) => name.endsWith('.mjs') || name.endsWith('.cjs') || name.endsWith('.js'));
  assert.deepEqual(
    executables.sort(),
    ['runtime-data.mjs'],
    `styled/ carries data only, got ${executables.join(', ')}`,
  );

  const mod = (await import(
    pathToFileURL(path.join(outDir, 'react', 'react.mjs')).href
  )) as unknown as ReactEntry;
  assert.equal(typeof mod.css, 'function', 'react entry exports css');
  assert.equal(typeof mod.recipe, 'function', 'react entry exports recipe');

  assert.equal(mod.css({ color: 'brand' }), `${prefix}c_brand`, 'css() constructs the compiled class');
  assert.equal(mod.css({ color: 'missing' }), `${prefix}c_missing`, 'css() misses construct silently');

  const chip = mod.recipe({ className: 'chip' })({ tone: 'accent', size: 'lg' });
  assert.ok(chip.includes(prefix), `recipe class carries the system prefix, got ${chip}`);

  const bundle = fs.readFileSync(path.join(outDir, 'react', 'react.mjs'), 'utf8');
  assert.ok(!bundle.includes('styled/css.mjs'), 'react entry no longer reaches into styled for css');
}
