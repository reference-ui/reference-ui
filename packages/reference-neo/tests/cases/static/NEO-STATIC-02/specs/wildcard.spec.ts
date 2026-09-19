// wildcard.spec.ts — spec for NEO-STATIC-02, the wildcard expansion case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// leaf, the doubled overlap, or the unpainted probe on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The world wildcarded the color category over three tokens with one static
// want overlapping n100. The sheet carries the three leaf atoms — expansion
// hit every leaf and the overlap deduped — plus the three harvested leaf-hex
// floors, and the control plus both runtime probes paint their shades.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  for (const leaf of ['n100', 'n200', 'n300']) {
    assert.ok(styles.includes(`.neo-static-02__c_${leaf}`), `sheet carries the ${leaf} atom`);
  }
  for (const hex of ['f4f4f5', 'e4e4e7', 'd4d4d8']) {
    assert.ok(styles.includes(`.neo-static-02__c_\\#${hex} {`), `sheet carries the harvested ${hex} floor`);
  }
  const utilityCount = styles.match(/\.neo-static-02__/g)?.length ?? 0;
  assert.equal(utilityCount, 6, `sheet carries the token count plus the harvest floor, got ${utilityCount}`);

  const control = page.locator('#control');
  await control.waitFor();
  const controlColor = await control.evaluate((el) => getComputedStyle(el).color);
  assert.equal(controlColor, 'rgb(244, 244, 245)', `control paints n100, got ${controlColor}`);

  const dyn = page.locator('#dyn');
  await dyn.waitFor();
  const dynColor = await dyn.evaluate((el) => getComputedStyle(el).color);
  assert.equal(dynColor, 'rgb(228, 228, 231)', `dynamic probe paints n200, got ${dynColor}`);

  const dyn2 = page.locator('#dyn2');
  await dyn2.waitFor();
  const dyn2Color = await dyn2.evaluate((el) => getComputedStyle(el).color);
  assert.equal(dyn2Color, 'rgb(212, 212, 216)', `second dynamic probe paints n300, got ${dyn2Color}`);
}
