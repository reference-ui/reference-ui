// binding.spec.ts — spec for NEO-SITE-04, the binding-identity case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// missing utility, the miscounted sheet, or the unpainted node on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// Both binding shapes are sites. The aliased node paints cherry, the
// namespaced node paints ocean, and the sheet carries exactly the two color
// utilities — the import spelling never decides what extracts.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('.neo-site-04__c_cherry {'), 'sheet carries the alias color');
  assert.ok(styles.includes('.neo-site-04__c_ocean {'), 'sheet carries the namespace color');
  const utilityCount = styles.match(/\.neo-site-04__/g)?.length ?? 0;
  assert.equal(utilityCount, 2, `sheet carries exactly the two binding utilities, got ${utilityCount}`);

  const aliased = page.locator('#aliased');
  await aliased.waitFor();
  const aliasColor = await aliased.evaluate((el) => getComputedStyle(el).color);
  assert.equal(aliasColor, 'rgb(220, 38, 38)', `alias paints cherry, got ${aliasColor}`);

  const namespaced = page.locator('#namespaced');
  await namespaced.waitFor();
  const nsColor = await namespaced.evaluate((el) => getComputedStyle(el).color);
  assert.equal(nsColor, 'rgb(37, 99, 235)', `namespace paints ocean, got ${nsColor}`);
}
