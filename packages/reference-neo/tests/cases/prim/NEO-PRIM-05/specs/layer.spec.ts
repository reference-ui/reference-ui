// layer.spec.ts — spec for NEO-PRIM-05, the data-layer case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the level
// whose stamp, inherit, or restamp broke the scope contract on failure.
import assert from 'node:assert/strict';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// Three levels, two trees, two stamps. The settled outer stamps once and the
// middle inherits it silently; the nested second tree knows no scope, so it
// stamps again. The inner probe still paints: the style runtime is shared
// even where the scope context is fresh.
export default async function run({ page, case: _c }: SpecInput): Promise<void> {
  void _c;
  const outer = page.locator('#outer');
  await outer.waitFor();
  assert.equal(
    await outer.evaluate((el) => el.getAttribute('data-layer')),
    'neo-prim5',
    'outer stamps the system layer',
  );
  assert.equal(
    await outer.evaluate((el) => el.getAttribute('data-color-mode')),
    'light',
    'outer stamps its explicit color mode',
  );

  const middle = page.locator('#middle');
  await middle.waitFor();
  assert.equal(
    await middle.evaluate((el) => el.getAttribute('data-layer')),
    null,
    'middle inherits the scope without restamping',
  );
  assert.equal(
    await middle.evaluate((el) => el.getAttribute('data-color-mode')),
    'light',
    'middle inherits the color mode stamp',
  );

  const inner = page.locator('#inner');
  await inner.waitFor();
  assert.equal(
    await inner.evaluate((el) => el.getAttribute('data-layer')),
    'neo-prim5',
    'inner tree restamps its own layer across the boundary',
  );
  assert.equal(
    await inner.evaluate((el) => el.getAttribute('data-color-mode')),
    null,
    'inner tree inherits no color mode across the boundary',
  );
  const innerColor = await inner.evaluate((el) => getComputedStyle(el).color);
  assert.equal(innerColor, 'rgb(124, 58, 237)', `inner probe paints brand, got ${innerColor}`);
}
