// shadow.spec.ts — spec for NEO-SITE-05, the shadowed-css case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming any
// minted utility or any painted color on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The local css is not a site. Sync succeeds (the case runs at all), the
// sheet carries zero utilities, and the node keeps its default text color —
// the local call mints no ghost class and raises no diagnostic noise.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const utilityCount = styles.match(/\.neo-site-05__/g)?.length ?? 0;
  assert.equal(utilityCount, 0, `sheet carries no utilities, got ${utilityCount}`);
  assert.ok(!styles.includes('c_cherry'), 'no cherry utility reaches the sheet');

  const target = page.locator('#target');
  await target.waitFor();
  const color = await target.evaluate((el) => getComputedStyle(el).color);
  assert.equal(color, 'rgb(0, 0, 0)', `shadowed call paints nothing, got ${color}`);
}
