// hover.spec.ts — spec for NEO-PRIM-03, the hover-prop case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// :is() selector, the miscounted utility, or the unpainted hover arm on failure.
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

// One :is() wrap, two utilities, two painted arms. The twin proves the
// data-hover arm without interaction; the live probe proves the :hover arm
// under a real hover and its release back to the base color. The _hover
// style prop itself never lands on either element.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const wraps = styles.split(':is(:hover, [data-hover])').length - 1;
  assert.equal(wraps, 1, `sheet carries one hover :is() selector, got ${wraps}`);
  const utilityCount = styles.match(/\.neo-prim3__/g)?.length ?? 0;
  assert.equal(utilityCount, 2, `sheet carries exactly the wanted utilities, got ${utilityCount}`);

  const twin = page.locator('#twin');
  await twin.waitFor();
  const twinColor = await twin.evaluate((el) => getComputedStyle(el).color);
  assert.equal(twinColor, 'rgb(124, 58, 237)', `twin paints via data-hover, got ${twinColor}`);

  const live = page.locator('#live');
  await live.waitFor();
  const rested = await live.evaluate((el) => getComputedStyle(el).color);
  assert.equal(rested, 'rgb(17, 17, 17)', `live rests on its base color, got ${rested}`);
  const liveHasTwin = await live.evaluate((el) => el.hasAttribute('data-hover'));
  assert.equal(liveHasTwin, false, 'live carries no data-hover, so only :hover can paint it');

  const hoverPage = page as unknown as HoverPage;
  await hoverPage.hover('#live');
  const hovered = await live.evaluate((el) => getComputedStyle(el).color);
  assert.equal(hovered, 'rgb(124, 58, 237)', `real hover paints, got ${hovered}`);

  await hoverPage.hover('#twin');
  const released = await live.evaluate((el) => getComputedStyle(el).color);
  assert.equal(released, 'rgb(17, 17, 17)', `leaving restores the base color, got ${released}`);

  for (const [node, id] of [[live, 'live'], [twin, 'twin']] as const) {
    assert.equal(
      await node.evaluate((el) => el.getAttribute('data-layer')),
      'neo-prim3',
      `${id} stamps the system layer`,
    );
    assert.equal(
      await node.evaluate((el) => el.hasAttribute('_hover')),
      false,
      `_hover stays off the ${id} element`,
    );
  }
}
