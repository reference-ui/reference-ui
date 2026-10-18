// member.spec.ts — spec for NEO-SITE-02, the const-member case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// missing utility or the unpainted member value on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The member access resolves to its leaf: the sheet carries exactly the
// cherry utility, the node takes that class, and the node paints cherry.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('.neo-site-02__c_cherry {'), 'sheet carries the member utility');
  const utilityCount = styles.match(/\.neo-site-02__/g)?.length ?? 0;
  assert.equal(utilityCount, 1, `sheet carries exactly the member utility, got ${utilityCount}`);

  const target = page.locator('#target');
  await target.waitFor();
  assert.equal(
    await target.evaluate((el) => (el as HTMLElement).className),
    'neo-site-02__c_cherry',
    'node takes the member class',
  );
  assert.equal(
    await target.evaluate((el) => getComputedStyle(el).color),
    'rgb(220, 38, 38)',
    'member value paints cherry',
  );
}
