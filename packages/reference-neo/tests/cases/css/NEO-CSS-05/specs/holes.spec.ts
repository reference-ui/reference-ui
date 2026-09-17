// holes.spec.ts — spec for NEO-CSS-05, the hole-leaf omission case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the ghost
// utility, the leaking class, or the unpainted live color on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// One live color beside three holes, plus a holes-only call. The sheet
// carries exactly the live utility, the mixed call paints brand, and the
// holes-only call leaves the element classless on its inherited ink.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('neo-css5__c_brand'), 'sheet carries the brand utility');
  const utilityCount = styles.match(/\.neo-css5__/g)?.length ?? 0;
  assert.equal(utilityCount, 1, `sheet carries exactly the live utility, got ${utilityCount}`);
  assert.ok(!styles.includes('background-color'), 'no ghost background rule leaks into the sheet');
  assert.ok(!styles.includes('border-color'), 'no ghost border rule leaks into the sheet');
  assert.ok(!styles.includes('outline-color'), 'no ghost outline rule leaks into the sheet');

  const holes = page.locator('#holes');
  await holes.waitFor();
  const holesClass = await holes.evaluate((el) => (el as HTMLElement).className);
  assert.equal(holesClass, 'neo-css5__c_brand', `mixed call resolves to the live class only, got ${holesClass}`);
  const holesColor = await holes.evaluate((el) => getComputedStyle(el).color);
  assert.equal(holesColor, 'rgb(124, 58, 237)', `live color paints brand, got ${holesColor}`);

  const empty = page.locator('#empty');
  await empty.waitFor();
  const emptyClass = await empty.evaluate((el) => (el as HTMLElement).className);
  assert.equal(emptyClass, '', `holes-only call resolves to no class, got ${emptyClass}`);
  const emptyColor = await empty.evaluate((el) => getComputedStyle(el).color);
  assert.equal(emptyColor, 'rgb(17, 17, 17)', `classless element rests on inherited ink, got ${emptyColor}`);
}
