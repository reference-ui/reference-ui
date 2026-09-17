// merge.spec.ts — spec for NEO-MERGE-01, the two-arg last-wins case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// atom, the uncollapsed class string, or the unpainted color on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// Two args, one slot: the sheet keeps both atoms, the class string keeps
// only the second, and the paint proves the second won the cascade slot.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('.neo-merge-01__c_ember {'), 'sheet carries the first color atom');
  assert.ok(styles.includes('.neo-merge-01__c_ocean {'), 'sheet carries the second color atom');
  const utilityCount = styles.match(/\.neo-merge-01__/g)?.length ?? 0;
  assert.equal(utilityCount, 2, `sheet carries exactly the wanted utilities, got ${utilityCount}`);

  const paint = page.locator('#paint');
  await paint.waitFor();
  const cls = await paint.evaluate((el) => el.getAttribute('class'));
  assert.equal(cls, 'neo-merge-01__c_ocean', `later arg wins the slot alone, got ${cls}`);
  const color = await paint.evaluate((el) => getComputedStyle(el).color);
  assert.equal(color, 'rgb(59, 130, 246)', `second color paints, got ${color}`);
}
