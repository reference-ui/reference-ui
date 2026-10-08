// xfile.spec.ts — spec for NEO-SITE-07, the cross-file case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// missing utility or the unpainted node on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The cross-file const resolves. The sheet carries exactly the cherry
// utility and the node paints cherry — the value's file never decides
// what extracts or what paints.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('.neo-site-07__c_cherry {'), 'sheet carries the cross-file color');
  const utilityCount = styles.match(/\.neo-site-07__/g)?.length ?? 0;
  assert.equal(utilityCount, 1, `sheet carries exactly the one utility, got ${utilityCount}`);

  const target = page.locator('#target');
  await target.waitFor();
  const color = await target.evaluate((el) => getComputedStyle(el).color);
  assert.equal(color, 'rgb(220, 38, 38)', `cross-file const paints cherry, got ${color}`);
}
