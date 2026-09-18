// comma.spec.ts — spec for NEO-COND-09, the comma-split case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// unsplit selector, the ghost utility, or the comma arm that fails to
// paint alone on failure.
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

// Two classes, one comma, five paints. The base class appears once and the
// comma class appears in two comma-split selectors in a single rule, and
// the button rests on ink, paints brand under hover alone and under focus
// alone, and returns to ink after each, proving the comma arms paint
// independently.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const hits = styles.match(/\.neo-cond-09__[^{\s,]*/g) ?? [];
  const distinct = new Set(hits);
  assert.equal(distinct.size, 2, `sheet mints base plus comma classes, got ${distinct.size}`);
  assert.equal(hits.length, 3, `base once plus comma twice, got ${hits.length}`);
  assert.match(styles, /:focus,\s*\.neo-cond-09__/, 'focus and hover selectors split on one comma');

  const comma = page.locator('#comma');
  await comma.waitFor();
  const rested = await comma.evaluate((el) => getComputedStyle(el).color);
  assert.equal(rested, 'rgb(17, 17, 17)', `button rests on ink, got ${rested}`);

  const hoverPage = page as unknown as HoverPage;
  await hoverPage.hover('#comma');
  const hovered = await comma.evaluate((el) => getComputedStyle(el).color);
  assert.equal(hovered, 'rgb(124, 58, 237)', `hover alone paints brand, got ${hovered}`);

  await hoverPage.hover('#plain');
  const released = await comma.evaluate((el) => getComputedStyle(el).color);
  assert.equal(released, 'rgb(17, 17, 17)', `leaving restores ink, got ${released}`);

  await comma.evaluate((el) => el.focus());
  const focused = await comma.evaluate((el) => getComputedStyle(el).color);
  assert.equal(focused, 'rgb(124, 58, 237)', `focus alone paints brand, got ${focused}`);

  await comma.evaluate((el) => el.blur());
  const blurred = await comma.evaluate((el) => getComputedStyle(el).color);
  assert.equal(blurred, 'rgb(17, 17, 17)', `blur restores ink, got ${blurred}`);
}
