// radii.spec.ts — spec for NEO-EDGE-02, the border radii case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// radius utility or the unpainted corner on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// Two radius tokens plus a dotted token path resolve to three utilities, and
// each paints its token value onto the probe corners.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('--radii-md'), 'sheet carries the md radius token');
  assert.ok(styles.includes('--radii-full'), 'sheet carries the full radius token');
  const utilityCount = styles.match(/\.neo-edge2__/g)?.length ?? 0;
  assert.equal(utilityCount, 3, `sheet carries exactly the wanted utilities, got ${utilityCount}`);

  const rounded = page.locator('#rounded');
  await rounded.waitFor();
  const roundedRadius = await rounded.evaluate((el) => getComputedStyle(el).borderTopLeftRadius);
  assert.equal(roundedRadius, '12px', `md paints the corners, got ${roundedRadius}`);

  const pill = page.locator('#pill');
  await pill.waitFor();
  const pillRadius = await pill.evaluate((el) => getComputedStyle(el).borderTopLeftRadius);
  assert.equal(pillRadius, '9999px', `full paints the corners, got ${pillRadius}`);

  const dotted = page.locator('#dotted');
  await dotted.waitFor();
  const dottedRadius = await dotted.evaluate((el) => getComputedStyle(el).borderTopLeftRadius);
  assert.equal(dottedRadius, '12px', `dotted token paths resolve, got ${dottedRadius}`);
}
