// chain.spec.ts — spec for NEO-COND-03, the hover/disabled chain case.
// Takes { page, case } from the runner with the world freshly synced and the
// page already navigated to it. Emits nothing on success; throws naming the
// unchained selector, the miscounted utility, or the probe whose paint
// ignores one arm of the chain on failure.
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

const CHAIN = ':is(:hover, [data-hover]):is(:disabled, [disabled], [data-disabled], [aria-disabled=true])';

// One chained selector, two utilities, five probes on one class. The data
// twins prove each arm gates the paint and the aria twin proves the aria
// member of the disabled list; the real disabled button proves the native
// :hover and :disabled arms chain the same way under a real hover.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes(CHAIN), 'sheet carries the chained hover/disabled selector');
  const utilityCount = styles.match(/\.neo-cond-03__/g)?.length ?? 0;
  assert.equal(utilityCount, 2, `sheet carries exactly the wanted utilities, got ${utilityCount}`);

  async function paint(selector: string): Promise<string> {
    const probe = page.locator(selector);
    await probe.waitFor();
    return probe.evaluate((el) => getComputedStyle(el).color);
  }

  const full = await paint('#full');
  assert.equal(full, 'rgb(124, 58, 237)', `data-hover plus data-disabled paints brand, got ${full}`);

  const aria = await paint('#aria');
  assert.equal(aria, 'rgb(124, 58, 237)', `data-hover plus aria-disabled paints brand, got ${aria}`);

  const hoverOnly = await paint('#hoverOnly');
  assert.equal(hoverOnly, 'rgb(17, 17, 17)', `hover without disabled keeps ink, got ${hoverOnly}`);

  const disabledOnly = await paint('#disabledOnly');
  assert.equal(disabledOnly, 'rgb(17, 17, 17)', `disabled without hover keeps ink, got ${disabledOnly}`);

  const liveRested = await paint('#live');
  assert.equal(liveRested, 'rgb(17, 17, 17)', `disabled button at rest keeps ink, got ${liveRested}`);

  const hoverPage = page as unknown as HoverPage;
  await hoverPage.hover('#live');
  const hovered = await paint('#live');
  assert.equal(hovered, 'rgb(124, 58, 237)', `real hover on the disabled button paints brand, got ${hovered}`);

  await hoverPage.hover('#hoverOnly');
  const released = await paint('#live');
  assert.equal(released, 'rgb(17, 17, 17)', `leaving the button restores ink, got ${released}`);
  const hoverOnlyRecheck = await paint('#hoverOnly');
  assert.equal(hoverOnlyRecheck, 'rgb(17, 17, 17)', `real hover still needs the disabled arm, got ${hoverOnlyRecheck}`);
}
