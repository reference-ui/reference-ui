// before-after.spec.ts — spec for NEO-COND-08, the pseudo-element case.
// Takes { page, case } from the runner with the world freshly synced and
// the page already navigated to it. Emits nothing on success; throws naming
// the misordered rule, the miscounted utility, or the pseudo-element that
// loses its quoted content on failure.
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

// Five utilities, one order, five paints. The hover rule sorts ahead of
// both pseudo-element rules, the quoted bang stays a string instead of
// importance, the paragraph rests on ink and hovers to accent, and each
// pseudo-element paints its own quoted content and token color.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const utilityCount = styles.match(/\.neo-cond-08__/g)?.length ?? 0;
  assert.equal(utilityCount, 5, `sheet carries exactly the wanted utilities, got ${utilityCount}`);
  // Order within the utilities layer: the reset carries its own ::before/::after.
  const utilities = styles.slice(styles.indexOf('@layer utilities {'));
  const hoverAt = utilities.indexOf(':is(:hover, [data-hover])');
  const beforeAt = utilities.indexOf('::before');
  const afterAt = utilities.indexOf('::after');
  assert.ok(hoverAt >= 0 && beforeAt >= 0 && afterAt >= 0, 'sheet carries hover, before, and after rules');
  assert.ok(hoverAt < beforeAt, 'hover rule sorts before the ::before rule');
  assert.ok(hoverAt < afterAt, 'hover rule sorts before the ::after rule');
  assert.ok(!utilities.includes('!important'), 'quoted bang emits no importance');

  const quote = page.locator('#quote');
  await quote.waitFor();
  const rested = await quote.evaluate((el) => getComputedStyle(el).color);
  assert.equal(rested, 'rgb(17, 17, 17)', `quote rests on ink, got ${rested}`);

  const beforeContent = await quote.evaluate((el) => getComputedStyle(el, '::before').content);
  assert.equal(beforeContent, '"yes!"', `::before keeps its quoted content, got ${beforeContent}`);
  const beforeColor = await quote.evaluate((el) => getComputedStyle(el, '::before').color);
  assert.equal(beforeColor, 'rgb(124, 58, 237)', `::before paints brand, got ${beforeColor}`);

  const afterContent = await quote.evaluate((el) => getComputedStyle(el, '::after').content);
  assert.equal(afterContent, '"[end]"', `::after keeps its quoted content, got ${afterContent}`);
  const afterColor = await quote.evaluate((el) => getComputedStyle(el, '::after').color);
  assert.equal(afterColor, 'rgb(22, 163, 74)', `::after paints accent, got ${afterColor}`);

  const hoverPage = page as unknown as HoverPage;
  await hoverPage.hover('#quote');
  const hovered = await quote.evaluate((el) => getComputedStyle(el).color);
  assert.equal(hovered, 'rgb(22, 163, 74)', `real hover paints accent, got ${hovered}`);

  await hoverPage.hover('#plain');
  const released = await quote.evaluate((el) => getComputedStyle(el).color);
  assert.equal(released, 'rgb(17, 17, 17)', `leaving restores ink, got ${released}`);
}
