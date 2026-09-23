// transitive.spec.ts — spec for NEO-CHAIN-01, the transitive-extends case.
// Takes { page, case } from the runner with the world freshly synced and the
// page already navigated to it. Emits nothing on success; throws naming the
// probe whose computed style missed its fixture oracle, or the merged
// artifact that dropped a depth, on failure.
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

// The runner synced this transitive world before serving: the outer-local
// background and copy paint their leaves while the inner-base eyebrow paints
// through the republished fragment — and the merged artifacts pin both
// depths plus the republished hosts.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');

  const [, demoBg] = await styleOf(page, 'demo-bg');
  assert.equal(demoBg, 'rgb(49, 46, 129)', `outer-local background paints, got ${demoBg}`);

  const [demoCopy] = await styleOf(page, 'demo-copy');
  assert.equal(demoCopy, 'rgb(224, 231, 255)', `outer-local copy paints, got ${demoCopy}`);

  const [eyebrow] = await styleOf(page, 'demo-eyebrow');
  assert.equal(eyebrow, 'rgb(20, 184, 166)', `transitive inner eyebrow paints, got ${eyebrow}`);

  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(
    styles.includes('@layer neo-chain1 {'),
    'sheet wraps the transitive build in the app package layer',
  );

  const evaluated = JSON.parse(
    fs.readFileSync(path.join(outDir, 'system', 'evaluated-system.json'), 'utf8'),
  ) as { tokens: { colors: unknown } };
  assert.deepEqual(
    evaluated.tokens.colors,
    {
      fixtureDemoAccent: { value: '#14b8a6' },
      metaExtendBg: { value: '#312e81' },
      metaExtendText: { value: '#e0e7ff' },
    },
    'evaluated tokens merge the inner republish with the outer-local leaves',
  );

  const jsx = JSON.parse(
    fs.readFileSync(path.join(outDir, 'system', 'jsx-elements.json'), 'utf8'),
  ) as { primitives: string[]; upstream: string[]; local: string[]; merged: string[] };
  assert.deepEqual(
    jsx,
    {
      primitives: [],
      upstream: ['DemoComponent', 'MetaExtendDemo'],
      local: [],
      merged: ['DemoComponent', 'MetaExtendDemo'],
    },
    'jsx hosts carry the republished inner plus outer hosts',
  );
}
