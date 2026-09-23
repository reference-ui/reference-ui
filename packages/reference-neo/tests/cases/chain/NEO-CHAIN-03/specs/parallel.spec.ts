// parallel.spec.ts — spec for NEO-CHAIN-03, the parallel-chains case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the probe
// whose computed style missed its fixture oracle, or the merged artifact
// that dropped a chain, on failure.
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

// The runner synced this parallel world before serving: each chain endpoint
// background paints alongside its own inner-base eyebrow, so both transitive
// paths contribute at the one boundary without interfering.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');

  const [, chain1Bg] = await styleOf(page, 'chain1-bg');
  assert.equal(chain1Bg, 'rgb(49, 46, 129)', `chain 1 endpoint paints, got ${chain1Bg}`);

  const [chain1Eyebrow] = await styleOf(page, 'chain1-eyebrow');
  assert.equal(chain1Eyebrow, 'rgb(20, 184, 166)', `chain 1 inner base paints, got ${chain1Eyebrow}`);

  const [, chain2Bg] = await styleOf(page, 'chain2-bg');
  assert.equal(chain2Bg, 'rgb(54, 83, 20)', `chain 2 endpoint paints, got ${chain2Bg}`);

  const [chain2Eyebrow] = await styleOf(page, 'chain2-eyebrow');
  assert.equal(chain2Eyebrow, 'rgb(52, 211, 153)', `chain 2 inner base paints, got ${chain2Eyebrow}`);

  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(
    styles.includes('@layer neo-chain3 {'),
    'sheet wraps the parallel build in the app package layer',
  );

  const evaluated = JSON.parse(
    fs.readFileSync(path.join(outDir, 'system', 'evaluated-system.json'), 'utf8'),
  ) as { tokens: { colors: unknown } };
  assert.deepEqual(
    evaluated.tokens.colors,
    {
      fixtureDemoAccent: { value: '#14b8a6' },
      metaExtendBg: { value: '#312e81' },
      metaExtend2Bg: { value: '#365314' },
      secondaryDemoAccent: { value: '#34d399' },
    },
    'evaluated tokens union both chains endpoint plus inner leaves',
  );

  const jsx = JSON.parse(
    fs.readFileSync(path.join(outDir, 'system', 'jsx-elements.json'), 'utf8'),
  ) as { primitives: string[]; upstream: string[]; local: string[]; merged: string[] };
  assert.deepEqual(
    jsx,
    {
      primitives: [],
      upstream: ['DemoComponent', 'MetaExtend2Demo', 'MetaExtendDemo', 'SecondaryDemoComponent'],
      local: [],
      merged: ['DemoComponent', 'MetaExtend2Demo', 'MetaExtendDemo', 'SecondaryDemoComponent'],
    },
    'jsx hosts union both chains republished hosts',
  );
}
