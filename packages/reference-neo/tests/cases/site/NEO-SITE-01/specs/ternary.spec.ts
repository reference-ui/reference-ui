// ternary.spec.ts — spec for NEO-SITE-01, the literal-ternary case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// missing arm utility, the wrong class string, or the unpainted arm.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// Both arms compile: the sheet carries exactly the cherry and ocean color
// utilities. The runtime picks cherry (no query string), so the node takes
// only the cherry class — the ocean atom exists unused — and paints cherry.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('.neo-site-01__c_cherry {'), 'sheet carries the cherry arm');
  assert.ok(styles.includes('.neo-site-01__c_ocean {'), 'sheet carries the ocean arm');
  const utilityCount = styles.match(/\.neo-site-01__/g)?.length ?? 0;
  assert.equal(utilityCount, 2, `sheet carries exactly the two arm utilities, got ${utilityCount}`);

  const target = page.locator('#target');
  await target.waitFor();
  assert.equal(
    await target.evaluate((el) => (el as HTMLElement).className),
    'neo-site-01__c_cherry',
    'node takes only the runtime-chosen cherry class',
  );
  assert.equal(
    await target.evaluate((el) => getComputedStyle(el).color),
    'rgb(220, 38, 38)',
    'runtime-chosen arm paints cherry',
  );
}
