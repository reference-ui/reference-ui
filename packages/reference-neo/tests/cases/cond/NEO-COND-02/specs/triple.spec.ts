// triple.spec.ts — spec for NEO-COND-02, the hover/container/theme triple
// case. Takes { page, case } from the runner with the world freshly synced
// and the page already navigated to it. Emits nothing on success; throws
// naming the misnested rule, the miscounted utility, or the arm of the
// triple that fails to gate the paint on failure.
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

// One triple rule: @container outside, the color-mode wrap inside it, one
// hover :is() list on the class. The data-hover twin proves the container
// and theme arms without interaction; the live probe proves the hover arm
// needs a real hover on top of the same wide root and dark mode.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const containerAt = styles.indexOf('@container (min-width: 640px)');
  assert.ok(containerAt >= 0, 'sheet carries the sm container rule');
  const darkAt = styles.indexOf('[data-color-mode=dark]');
  assert.ok(darkAt >= 0, 'sheet carries the dark wrap');
  assert.ok(
    containerAt < darkAt,
    'sheet nests the container rule outside the dark wrap',
  );
  const wraps = styles.split(':is(:hover, [data-hover])').length - 1;
  assert.equal(wraps, 1, `sheet carries one hover :is() selector, got ${wraps}`);
  const utilityCount = styles.match(/\.neo-cond-02__/g)?.length ?? 0;
  assert.equal(utilityCount, 3, `sheet carries exactly the wanted utilities, got ${utilityCount}`);

  const twin = page.locator('#twin');
  await twin.waitFor();
  const live = page.locator('#live');
  await live.waitFor();
  const root = page.locator('#root');
  await root.waitFor();

  async function paint(selector: string): Promise<string> {
    const probe = page.locator(selector);
    await probe.waitFor();
    return probe.evaluate((el) => getComputedStyle(el).backgroundColor);
  }

  async function setMode(mode: string): Promise<void> {
    if (mode === 'dark') {
      await twin.evaluate((el) => {
        el.ownerDocument.documentElement.setAttribute('data-color-mode', 'dark');
      });
    } else {
      await twin.evaluate((el) => {
        el.ownerDocument.documentElement.setAttribute('data-color-mode', 'light');
      });
    }
  }

  async function clearMode(): Promise<void> {
    await twin.evaluate((el) => {
      el.ownerDocument.documentElement.removeAttribute('data-color-mode');
    });
  }

  const rested = await paint('#twin');
  assert.equal(rested, 'rgb(17, 17, 17)', `no mode rests on the ink base, got ${rested}`);

  await setMode('dark');
  const allThree = await paint('#twin');
  assert.equal(allThree, 'rgb(255, 255, 255)', `wide plus dark plus twin-hover paints paper, got ${allThree}`);

  const liveRested = await paint('#live');
  assert.equal(liveRested, 'rgb(17, 17, 17)', `live without hover keeps ink, got ${liveRested}`);

  await root.evaluate((el) => {
    el.style.width = '400px';
  });
  const narrowed = await paint('#twin');
  assert.equal(narrowed, 'rgb(17, 17, 17)', `narrowing the root restores ink, got ${narrowed}`);

  await root.evaluate((el) => {
    el.style.width = '800px';
  });
  const rewidened = await paint('#twin');
  assert.equal(rewidened, 'rgb(255, 255, 255)', `rewidening repaints paper, got ${rewidened}`);

  await setMode('light');
  const lit = await paint('#twin');
  assert.equal(lit, 'rgb(17, 17, 17)', `light mode restores ink, got ${lit}`);

  await setMode('dark');
  const hoverPage = page as unknown as HoverPage;
  await hoverPage.hover('#live');
  const hovered = await paint('#live');
  assert.equal(hovered, 'rgb(255, 255, 255)', `real hover on the live probe paints paper, got ${hovered}`);

  await hoverPage.hover('#twin');
  const released = await paint('#live');
  assert.equal(released, 'rgb(17, 17, 17)', `leaving the live probe restores ink, got ${released}`);

  await clearMode();
  const cleared = await paint('#twin');
  assert.equal(cleared, 'rgb(17, 17, 17)', `clearing the mode restores ink, got ${cleared}`);
}
