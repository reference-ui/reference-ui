// css.spec.ts — spec for NEO-CSS-01, the runtime css() painting case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// utility, the ghost class, or the unpainted declaration on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

const EXPECTED_CLASSES = ['neo-css__c_brand', 'neo-css__bg-c_ink', 'neo-css__p_sm'];

// The world called css() twice: three flat declarations plus one hover rule.
// The sheet carries exactly those four utilities, and each paints live.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  // Ghost-hunt in the utilities layer: the reset legitimately carries margin: 0.
  const utilities = styles.slice(styles.indexOf('@layer utilities {'));
  for (const cls of EXPECTED_CLASSES) {
    assert.ok(styles.includes(`.${cls} {`), `sheet carries .${cls}`);
  }
  assert.ok(styles.includes(':is(:hover, [data-hover])'), 'sheet carries the hover variant');
  const utilityCount = styles.match(/\.neo-css__/g)?.length ?? 0;
  assert.equal(utilityCount, 4, `sheet carries exactly the wanted utilities, got ${utilityCount}`);
  assert.ok(!utilities.includes('margin'), 'no ghost margin utilities leak into the utilities layer');

  const paint = page.locator('#paint');
  await paint.waitFor();
  const color = await paint.evaluate((el) => getComputedStyle(el).color);
  assert.equal(color, 'rgb(124, 58, 237)', `brand paints the text, got ${color}`);
  const background = await paint.evaluate((el) => getComputedStyle(el).backgroundColor);
  assert.equal(background, 'rgb(17, 17, 17)', `ink paints the background, got ${background}`);
  const padding = await paint.evaluate((el) => getComputedStyle(el).paddingTop);
  assert.equal(padding, '8px', `spacing paints the padding, got ${padding}`);

  const hoverable = page.locator('#hoverable');
  await hoverable.waitFor();
  const hoverColor = await hoverable.evaluate((el) => getComputedStyle(el).color);
  assert.equal(hoverColor, 'rgb(124, 58, 237)', `hover paints via data-hover, got ${hoverColor}`);
}
