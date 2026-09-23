// diamond.spec.ts — spec for NEO-CHAIN-02, the diamond-extends case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the probe
// whose computed style missed its fixture oracle, or the merged artifact
// that dropped a branch, on failure.
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

// The runner synced this diamond world before serving: both branch-local
// backgrounds paint while the shared inner base paints on both eyebrows —
// the base lands twice and every adoption still resolves.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');

  const [, leftBg] = await styleOf(page, 'left-bg');
  assert.equal(leftBg, 'rgb(49, 46, 129)', `left branch background paints, got ${leftBg}`);

  const [leftEyebrow] = await styleOf(page, 'left-eyebrow');
  assert.equal(leftEyebrow, 'rgb(20, 184, 166)', `shared base paints on the left eyebrow, got ${leftEyebrow}`);

  const [, rightBg] = await styleOf(page, 'right-bg');
  assert.equal(rightBg, 'rgb(124, 45, 18)', `right branch background paints, got ${rightBg}`);

  const [rightEyebrow] = await styleOf(page, 'right-eyebrow');
  assert.equal(rightEyebrow, 'rgb(20, 184, 166)', `shared base paints on the right eyebrow, got ${rightEyebrow}`);

  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(
    styles.includes('@layer neo-chain2 {'),
    'sheet wraps the diamond build in the app package layer',
  );

  const evaluated = JSON.parse(
    fs.readFileSync(path.join(outDir, 'system', 'evaluated-system.json'), 'utf8'),
  ) as { tokens: { colors: unknown } };
  assert.deepEqual(
    evaluated.tokens.colors,
    {
      fixtureDemoAccent: { value: '#14b8a6' },
      metaExtendBg: { value: '#312e81' },
      metaSiblingBg: { value: '#7c2d12' },
    },
    'evaluated tokens merge both branches with the shared base resolving once',
  );

  const jsx = JSON.parse(
    fs.readFileSync(path.join(outDir, 'system', 'jsx-elements.json'), 'utf8'),
  ) as { primitives: string[]; upstream: string[]; local: string[]; merged: string[] };
  assert.deepEqual(
    jsx,
    {
      primitives: [],
      upstream: ['DemoComponent', 'MetaExtendDemo', 'MetaSiblingDemo'],
      local: [],
      merged: ['DemoComponent', 'MetaExtendDemo', 'MetaSiblingDemo'],
    },
    'jsx hosts merge both branches with the shared host resolving once',
  );
}
