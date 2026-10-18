// multi-extends.spec.ts — spec for NEO-CHAIN-04, the parallel-direct-extends
// case. Takes { page, case } from the runner with the world freshly synced
// and the page already navigated to it. Emits nothing on success; throws
// naming the probe whose computed style missed its oracle, or the merged
// artifact that dropped an upstream, on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

async function styleOf(page: SpecPage, id: string): Promise<[string, string]> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  return node.evaluate((el) => {
    const style = getComputedStyle(el);
    return [style.color, style.backgroundColor] as [string, string];
  });
}

// The runner synced this parallel world before serving: both upstreams adopt
// at the one boundary, and the shared order leaf paints the second entry's
// value — declared extends order arbitrates, later entry wins.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');

  const [, firstBg] = await styleOf(page, 'first-bg');
  assert.equal(firstBg, 'rgb(15, 23, 42)', `first upstream background paints, got ${firstBg}`);

  const [firstEyebrow] = await styleOf(page, 'first-eyebrow');
  assert.equal(firstEyebrow, 'rgb(20, 184, 166)', `first upstream accent paints, got ${firstEyebrow}`);

  const [, secondBg] = await styleOf(page, 'second-bg');
  assert.equal(secondBg, 'rgb(6, 78, 59)', `second upstream background paints, got ${secondBg}`);

  const [orderMark] = await styleOf(page, 'order-probe');
  assert.equal(orderMark, 'rgb(34, 34, 34)', `later extends entry wins the shared leaf, got ${orderMark}`);

  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(
    styles.includes('@layer neo-chain4 {'),
    'sheet wraps the parallel build in the app package layer',
  );

  const evaluated = JSON.parse(
    fs.readFileSync(path.join(outDir, 'system', 'evaluated-system.json'), 'utf8'),
  ) as { tokens: { colors: unknown } };
  assert.deepEqual(
    evaluated.tokens.colors,
    {
      fixtureDemoAccent: { value: '#14b8a6' },
      fixtureDemoBg: { value: '#0f172a' },
      fixtureDemoText: { value: '#f8fafc' },
      orderMark: { value: '#222222' },
      secondaryDemoAccent: { value: '#34d399' },
      secondaryDemoBg: { value: '#064e3b' },
      secondaryDemoText: { value: '#d1fae5' },
    },
    'evaluated tokens union both upstreams with the later entry winning shared',
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
      upstream: ['DemoComponent', 'SecondaryDemoComponent'],
      local: [],
      merged: ['DemoComponent', 'SecondaryDemoComponent'],
    },
    'jsx hosts union both direct upstreams',
  );
}
