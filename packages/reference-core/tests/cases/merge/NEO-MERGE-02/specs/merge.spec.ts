// merge.spec.ts — spec for NEO-MERGE-02, the alias last-wins case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// atom, the uncollapsed class string, or the unpainted background on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// Alias plus longhand, one slot: the sheet keeps both atoms, the class
// string keeps only the later longhand, and the paint proves it won.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('.neo-merge-02__bg_sand {'), 'sheet carries the alias atom');
  assert.ok(styles.includes('.neo-merge-02__bg_clay {'), 'sheet carries the longhand atom');
  const utilityCount = styles.match(/\.neo-merge-02__/g)?.length ?? 0;
  assert.equal(utilityCount, 2, `sheet carries exactly the wanted utilities, got ${utilityCount}`);

  const paint = page.locator('#paint');
  await paint.waitFor();
  const cls = await paint.evaluate((el) => el.getAttribute('class'));
  assert.equal(cls, 'neo-merge-02__bg_clay', `longhand wins the slot alone, got ${cls}`);
  const background = await paint.evaluate((el) => getComputedStyle(el).backgroundColor);
  assert.equal(background, 'rgb(228, 228, 231)', `clay background paints, got ${background}`);
}
