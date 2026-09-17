// merge.spec.ts — spec for NEO-MERGE-03, the shorthand/longhand case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// atom, the misordered sheet, or the mispadded side on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// Shorthand plus longhand, two slots: the sheet prints the shorthand first,
// the class string keeps both, and each computed side paints its winner.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const shorthand = styles.indexOf('.neo-merge-03__p_sm {');
  const longhand = styles.indexOf('.neo-merge-03__pt_lg {');
  assert.ok(shorthand > -1, 'sheet carries the padding shorthand atom');
  assert.ok(longhand > -1, 'sheet carries the paddingTop longhand atom');
  assert.ok(shorthand < longhand, 'shorthand prints before the longhand in the sheet');
  const utilityCount = styles.match(/\.neo-merge-03__/g)?.length ?? 0;
  assert.equal(utilityCount, 2, `sheet carries exactly the wanted utilities, got ${utilityCount}`);

  const pad = page.locator('#pad');
  await pad.waitFor();
  const cls = await pad.evaluate((el) => el.getAttribute('class'));
  assert.equal(
    cls,
    'neo-merge-03__p_sm neo-merge-03__pt_lg',
    `both slots survive the merge, got ${cls}`,
  );
  const top = await pad.evaluate((el) => getComputedStyle(el).paddingTop);
  assert.equal(top, '16px', `longhand wins the top, got ${top}`);
  const right = await pad.evaluate((el) => getComputedStyle(el).paddingRight);
  assert.equal(right, '8px', `shorthand holds the right, got ${right}`);
  const bottom = await pad.evaluate((el) => getComputedStyle(el).paddingBottom);
  assert.equal(bottom, '8px', `shorthand holds the bottom, got ${bottom}`);
  const left = await pad.evaluate((el) => getComputedStyle(el).paddingLeft);
  assert.equal(left, '8px', `shorthand holds the left, got ${left}`);
}
