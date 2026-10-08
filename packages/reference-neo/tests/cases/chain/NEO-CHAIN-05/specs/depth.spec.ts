// depth.spec.ts — spec for NEO-CHAIN-05, the depth-three chain case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the depth
// whose computed style missed its oracle, or the merged artifact that
// dropped a depth, on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

async function backgroundOf(page: SpecPage, id: string): Promise<string> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  return node.evaluate((el) => getComputedStyle(el).backgroundColor);
}

// The runner synced this depth-three world before serving: the innermost
// base, the middle republish, and the apex-local leaf all paint from the
// single extends entry — flattening holds past depth two.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');

  const depthA = await backgroundOf(page, 'depth-a');
  assert.equal(depthA, 'rgb(15, 23, 42)', `innermost depth paints, got ${depthA}`);

  const depthB = await backgroundOf(page, 'depth-b');
  assert.equal(depthB, 'rgb(49, 46, 129)', `middle depth paints, got ${depthB}`);

  const depthC = await backgroundOf(page, 'depth-c');
  assert.equal(depthC, 'rgb(76, 29, 149)', `apex depth paints, got ${depthC}`);

  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(
    styles.includes('@layer neo-chain5 {'),
    'sheet wraps the depth-three build in the app package layer',
  );

  const evaluated = JSON.parse(
    fs.readFileSync(path.join(outDir, 'system', 'evaluated-system.json'), 'utf8'),
  ) as { tokens: { colors: unknown } };
  assert.deepEqual(
    evaluated.tokens.colors,
    {
      apexBg: { value: '#4c1d95' },
      fixtureDemoBg: { value: '#0f172a' },
      metaExtendBg: { value: '#312e81' },
    },
    'evaluated tokens flatten all three depths',
  );

  // Primitives read back from the generated types, not from neo source: the
  // per-tag declares are what the packager emitted for this very sync.
  const reactTypes = fs.readFileSync(path.join(outDir, 'react', 'react.d.mts'), 'utf8');
  const generated = [...reactTypes.matchAll(/export declare const (\w+): \(props: \w+Props/g)].map(
    (m) => m[1] as string,
  );

  const jsx = JSON.parse(
    fs.readFileSync(path.join(outDir, 'system', 'jsx-elements.json'), 'utf8'),
  ) as { primitives: string[]; upstream: string[]; local: string[]; merged: string[] };
  assert.deepEqual(
    jsx,
    {
      primitives: [...new Set(generated)].sort(),
      upstream: ['ApexDemo', 'DemoComponent', 'MetaExtendDemo'],
      local: [],
      merged: ['ApexDemo', 'DemoComponent', 'MetaExtendDemo'],
    },
    'jsx hosts carry all three depths republished hosts',
  );
}
