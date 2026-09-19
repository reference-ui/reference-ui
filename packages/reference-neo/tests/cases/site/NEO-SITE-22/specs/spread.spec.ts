// spread.spec.ts — spec for NEO-SITE-22, the runtime-guarded logical-spread
// case. Takes { page, case } from the runner with the world freshly synced
// and the page already navigated to it. Emits nothing on success; throws
// naming the missing utility or the unpainted declaration on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The runtime-guarded logical spread unpacks beside its sibling: the sheet
// carries both utilities, and the node paints the sibling color plus the
// spread margin. Sync succeeds (the case runs at all).
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('.neo-site-22__c_red {'), 'sheet carries the sibling color');
  assert.ok(styles.includes('.neo-site-22__m_10px {'), 'sheet carries the spread margin');
  const utilityCount = styles.match(/\.neo-site-22__/g)?.length ?? 0;
  assert.equal(utilityCount, 2, `sheet carries exactly the two utilities, got ${utilityCount}`);

  const target = page.locator('#target');
  await target.waitFor();
  assert.equal(
    await target.evaluate((el) => (el as HTMLElement).className),
    'neo-site-22__c_red neo-site-22__m_10px',
    'node carries the sibling plus the spread class',
  );
  assert.equal(
    await target.evaluate((el) => getComputedStyle(el).color),
    'rgb(255, 0, 0)',
    'sibling color paints',
  );
  assert.equal(
    await target.evaluate((el) => getComputedStyle(el).marginTop),
    '10px',
    'spread margin paints',
  );
}
