// flex.spec.ts — spec for NEO-MERGE-08, the undefined longhand case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// missing utility, the uncollapsed class string, or the unpainted axis.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// Shorthand plus an undefined longhand: the sheet carries the one remapped
// utility, the class string keeps it alone, and the probe paints a column.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(
    styles.includes('.neo-merge-08__flex-dir_column {'),
    'sheet carries the remapped flex utility',
  );
  const utilityCount = styles.match(/\.neo-merge-08__/g)?.length ?? 0;
  assert.equal(utilityCount, 1, `sheet carries exactly the wanted utility, got ${utilityCount}`);

  const probe = page.locator('#probe');
  await probe.waitFor();
  const cls = await probe.evaluate((el) => el.getAttribute('class'));
  assert.equal(
    cls,
    'neo-merge-08__flex-dir_column',
    `defined shorthand survives the hole alone, got ${cls}`,
  );
  const direction = await probe.evaluate((el) => getComputedStyle(el).flexDirection);
  assert.equal(direction, 'column', `probe paints a column, got ${direction}`);
}
