// conjunction.spec.ts — spec for NEO-RECIPE-12, the media/container
// conjunction case. Takes { page, case } from the runner with the world
// freshly synced and the page already navigated to it. Emits nothing on
// success; throws naming the branch that fails to join the conjunction.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

async function readState(page: SpecPage, selector: string): Promise<Record<string, string>> {
  const probe = page.locator(selector);
  await probe.waitFor();
  return probe.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      paddingTop: style.paddingTop,
      backgroundColor: style.backgroundColor,
      borderTopWidth: style.borderTopWidth,
      borderTopColor: style.borderTopColor,
    };
  });
}

// One class, two queries, two cells. At a 980px viewport the wide probe
// paints both branches at once; the narrow probe paints the viewport
// branch only, proving the container half still gates inside the recipe.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('@media (min-width: 900px)'), 'sheet carries the 900px media block');
  assert.ok(styles.includes('@container (min-width: 320px)'), 'sheet carries the 320px container block');

  await page.setViewportSize({ width: 980, height: 900 });

  const wide = await readState(page, '#target-wide');
  assert.equal(wide.paddingTop, '20px', 'wide probe paints the viewport padding');
  assert.equal(wide.backgroundColor, 'rgb(29, 78, 216)', 'wide probe paints the viewport background');
  assert.equal(wide.borderTopWidth, '7px', 'wide probe paints the container border width');
  assert.equal(wide.borderTopColor, 'rgb(249, 115, 22)', 'wide probe paints the container border color');

  const narrow = await readState(page, '#target-narrow');
  assert.equal(narrow.paddingTop, '20px', 'narrow probe still paints the viewport padding');
  assert.equal(narrow.backgroundColor, 'rgb(29, 78, 216)', 'narrow probe still paints the viewport background');
  assert.equal(narrow.borderTopWidth, '0px', 'narrow probe keeps the container border off');
}
