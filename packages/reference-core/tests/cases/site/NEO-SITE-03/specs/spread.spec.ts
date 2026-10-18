// spread.spec.ts — spec for NEO-SITE-03, the identifier-spread case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// missing sibling or spread utility, or the unpainted half, on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The identifier spread unpacks beside its sibling: the sheet carries both
// utilities and nothing else, the node takes both classes, and the node
// paints the sibling color plus the spread margin.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('.neo-site-03__c_cherry {'), 'sheet carries the sibling color');
  assert.ok(styles.includes('.neo-site-03__mt_gap {'), 'sheet carries the spread margin');
  const utilityCount = styles.match(/\.neo-site-03__/g)?.length ?? 0;
  assert.equal(utilityCount, 2, `sheet carries exactly the two utilities, got ${utilityCount}`);

  const target = page.locator('#target');
  await target.waitFor();
  assert.equal(
    await target.evaluate((el) => (el as HTMLElement).className),
    'neo-site-03__c_cherry neo-site-03__mt_gap',
    'node carries the sibling plus the spread class',
  );
  assert.equal(
    await target.evaluate((el) => getComputedStyle(el).color),
    'rgb(220, 38, 38)',
    'sibling color paints',
  );
  assert.equal(
    await target.evaluate((el) => getComputedStyle(el).marginTop),
    '12px',
    'spread margin paints',
  );
}
