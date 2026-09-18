// resolve.spec.ts — spec for NEO-SYNC-05, the consumer-specifier case. Takes
// { case } from the runner with the world freshly synced and asserts node-side.
// Emits nothing on success; throws naming the specifier that fails to resolve
// to its D5 target on failure.
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

interface GeneratedPackage {
  exports?: Record<string, unknown>;
}

interface WorldResolver {
  resolve: (specifier: string) => string;
}

// The runner synced this world before serving: the four bare consumer
// specifiers resolve through the generated exports maps to the D5
// filenames. Resolution runs inside a world-local probe module so the
// parent is the world (like a real consumer import), not the spec file.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const probe = (await import(
    pathToFileURL(path.join(c.worldDir, 'resolve-from-world.mjs')).href
  )) as unknown as WorldResolver;
  const real = (p: string): string => fs.realpathSync(p);
  const resolved = (specifier: string): string =>
    real(fileURLToPath(probe.resolve(specifier)));

  const reactEntry = resolved('@reference-ui/react');
  assert.equal(
    reactEntry,
    real(path.join(outDir, 'react', 'react.mjs')),
    `@reference-ui/react resolves to react.mjs, got ${reactEntry}`,
  );

  const reactCss = resolved('@reference-ui/react/styles.css');
  assert.equal(
    reactCss,
    real(path.join(outDir, 'react', 'styles.css')),
    `@reference-ui/react/styles.css resolves to react/styles.css, got ${reactCss}`,
  );
  assert.equal(
    fs.readFileSync(reactCss, 'utf8'),
    fs.readFileSync(path.join(outDir, 'styled', 'styles.css'), 'utf8'),
    'react/styles.css is the D5 copy of the styled sheet',
  );

  // system.mjs landed with SYNC-12; '.' serves the authoring entry.
  const systemEntry = resolved('@reference-ui/system');
  assert.equal(
    systemEntry,
    real(path.join(outDir, 'system', 'system.mjs')),
    `@reference-ui/system resolves to the system entry, got ${systemEntry}`,
  );
  const baseSystem = resolved('@reference-ui/system/baseSystem');
  assert.equal(
    baseSystem,
    real(path.join(outDir, 'system', 'baseSystem.mjs')),
    `@reference-ui/system/baseSystem resolves to baseSystem.mjs, got ${baseSystem}`,
  );

  const reactPkg = JSON.parse(
    fs.readFileSync(path.join(outDir, 'react', 'package.json'), 'utf8'),
  ) as GeneratedPackage;
  assert.deepEqual(
    reactPkg.exports?.['.'],
    { types: './react.d.mts', import: './react.mjs' },
    'react exports map pins the D5 entry filenames',
  );
  assert.equal(reactPkg.exports?.['./styles.css'], './styles.css', 'react exports map carries ./styles.css');

  const systemPkg = JSON.parse(
    fs.readFileSync(path.join(outDir, 'system', 'package.json'), 'utf8'),
  ) as GeneratedPackage;
  assert.ok(systemPkg.exports?.['.'] !== undefined, 'system exports map carries .');
  assert.ok(systemPkg.exports?.['./baseSystem'] !== undefined, 'system exports map carries ./baseSystem');

  const styledPkg = JSON.parse(
    fs.readFileSync(path.join(outDir, 'styled', 'package.json'), 'utf8'),
  ) as GeneratedPackage;
  assert.deepEqual(
    styledPkg.exports?.['.'],
    { types: './index.d.ts', import: './runtime-data.mjs' },
    'styled exports map carries its data entry plus the declaration entry',
  );
  assert.deepEqual(
    styledPkg.exports?.['./tokens'],
    { types: './tokens.d.ts' },
    'styled exports map carries ./tokens',
  );
  assert.deepEqual(
    styledPkg.exports?.['./types'],
    { types: './types/index.d.ts' },
    'styled exports map carries ./types',
  );
  assert.deepEqual(
    styledPkg.exports?.['./types/*'],
    { types: './types/*.d.ts' },
    'styled exports map carries ./types/*',
  );

  for (const name of ['system', 'styled', 'react']) {
    const link = path.join(c.worldDir, 'node_modules', '@reference-ui', name);
    assert.ok(fs.existsSync(link), `project links @reference-ui/${name}`);
    assert.ok(fs.lstatSync(link).isSymbolicLink(), `@reference-ui/${name} links into the folder`);
  }

  const mod = (await import(pathToFileURL(reactEntry).href)) as unknown as {
    css: unknown;
    recipe: unknown;
  };
  assert.equal(typeof mod.css, 'function', 'resolved react entry exports css');
  assert.equal(typeof mod.recipe, 'function', 'resolved react entry exports recipe');
}
