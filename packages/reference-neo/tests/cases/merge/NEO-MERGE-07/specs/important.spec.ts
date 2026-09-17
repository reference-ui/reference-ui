// important.spec.ts — spec for NEO-MERGE-07, the important-beats-plain
// case. Takes { page, case } from the runner with the world freshly synced
// and the page already navigated to it. Emits nothing on success; throws
// naming the missing atom, the uncollapsed class string, or the probe the
// plain ocean steals from the important ember on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// One slot, three authorships: the sheet keeps both atoms with the spaced
// important spelling, both merged strings collapse to the important atom
// alone, and both paint ember while the plain control paints ocean.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('c_ember'), 'sheet carries the important ember atom');
  assert.ok(styles.includes('.neo-merge-07__c_ocean {'), 'sheet carries the plain ocean atom');
  assert.ok(
    styles.includes('color: var(--colors-ember) !important;'),
    'sheet spells the important declaration with a space',
  );
  const utilityCount = styles.match(/\.neo-merge-07__/g)?.length ?? 0;
  assert.equal(utilityCount, 2, `sheet carries exactly the wanted utilities, got ${utilityCount}`);

  const early = page.locator('#early');
  await early.waitFor();
  const earlyCls = await early.evaluate((el) => el.getAttribute('class'));
  assert.equal(
    earlyCls,
    'neo-merge-07__c_ember!',
    `earlier important beats later plain alone, got ${earlyCls}`,
  );
  const earlyColor = await early.evaluate((el) => getComputedStyle(el).color);
  assert.equal(earlyColor, 'rgb(239, 68, 68)', `early paints ember, got ${earlyColor}`);

  const late = page.locator('#late');
  await late.waitFor();
  const lateCls = await late.evaluate((el) => el.getAttribute('class'));
  assert.equal(
    lateCls,
    'neo-merge-07__c_ember!',
    `later important beats earlier plain alone, got ${lateCls}`,
  );
  const lateColor = await late.evaluate((el) => getComputedStyle(el).color);
  assert.equal(lateColor, 'rgb(239, 68, 68)', `late paints ember, got ${lateColor}`);

  const plain = page.locator('#plain');
  await plain.waitFor();
  const plainCls = await plain.evaluate((el) => el.getAttribute('class'));
  assert.equal(plainCls, 'neo-merge-07__c_ocean', `control carries ocean alone, got ${plainCls}`);
  const plainColor = await plain.evaluate((el) => getComputedStyle(el).color);
  assert.equal(plainColor, 'rgb(59, 130, 246)', `control paints ocean, got ${plainColor}`);
}
