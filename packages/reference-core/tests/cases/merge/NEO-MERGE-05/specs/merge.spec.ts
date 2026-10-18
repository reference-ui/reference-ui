// merge.spec.ts — spec for NEO-MERGE-05, the conditional merge case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// missing atom, the divergent form, or the unpainted hover on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The runner hands specs the real Playwright page, whose hover member the
// narrow SpecPage shape omits; this interface names just that member.
interface HoverPage {
  hover(selector: string): Promise<void>;
}

// Base plus hover, two forms: the sheet keeps both atoms with no query
// wrap, both class strings match exactly, and hover paints ocean over ember.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('.neo-merge-05__c_ember {'), 'sheet carries the base color atom');
  const wraps = styles.split(':is(:hover, [data-hover])').length - 1;
  assert.equal(wraps, 1, `sheet carries one hover :is() selector, got ${wraps}`);
  const utilityCount = styles.match(/\.neo-merge-05__/g)?.length ?? 0;
  assert.equal(utilityCount, 2, `sheet carries exactly the wanted utilities, got ${utilityCount}`);
  // Query checks stay in the utilities layer: the reset carries a
  // prefers-reduced-motion @media for accessibility, not responsive design.
  const utilities = styles.slice(styles.indexOf('@layer utilities {'));
  assert.ok(!utilities.includes('@container'), 'the merge list never reads as a responsive array');
  assert.ok(!utilities.includes('@media'), 'the merge list wraps in no media query');

  const args = page.locator('#args');
  await args.waitFor();
  const list = page.locator('#list');
  await list.waitFor();
  const argsCls = await args.evaluate((el) => el.getAttribute('class'));
  assert.equal(
    argsCls,
    'neo-merge-05__c_ember neo-merge-05__hover:c_ocean',
    `multi-arg form merges both slots, got ${argsCls}`,
  );
  const listCls = await list.evaluate((el) => el.getAttribute('class'));
  assert.equal(listCls, argsCls, `merge-list form matches the multi-arg form, got ${listCls}`);

  const rested = await args.evaluate((el) => getComputedStyle(el).color);
  assert.equal(rested, 'rgb(239, 68, 68)', `resting paints ember, got ${rested}`);

  const hoverPage = page as unknown as HoverPage;
  await hoverPage.hover('#args');
  const hovered = await args.evaluate((el) => getComputedStyle(el).color);
  assert.equal(hovered, 'rgb(59, 130, 246)', `hover paints the merged ocean, got ${hovered}`);

  await hoverPage.hover('#list');
  const released = await args.evaluate((el) => getComputedStyle(el).color);
  assert.equal(released, 'rgb(239, 68, 68)', `leaving restores ember, got ${released}`);
}
