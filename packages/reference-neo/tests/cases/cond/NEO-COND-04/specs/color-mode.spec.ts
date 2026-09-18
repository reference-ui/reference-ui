// color-mode.spec.ts — spec for NEO-COND-04, the color-mode flip case.
// Takes { page, case } from the runner with the world freshly synced and the
// page already navigated to it. Emits nothing on success; throws naming the
// missing color-mode wrap, the second stamp, or the unflipped paint on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// One element, three utilities, two wraps, no second stamp. The element rests
// on its base color with no attribute set, then flips per data-color-mode,
// first on the html root and then on a nested wrapper, proving any ancestor
// carries the mode.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('[data-color-mode=dark]'), 'sheet wraps the dark utility');
  assert.ok(styles.includes('[data-color-mode=light]'), 'sheet wraps the light utility');
  assert.ok(!styles.includes('data-panda-theme'), 'sheet never stamps the retired theme attribute');
  assert.ok(!styles.includes('[data-theme='), 'sheet never stamps the bare data-theme attribute');
  assert.ok(!styles.includes('.dark .'), 'sheet never wraps with a dark class');
  assert.ok(!styles.includes('.light .'), 'sheet never wraps with a light class');
  const utilityCount = styles.match(/\.neo-cond-04__/g)?.length ?? 0;
  assert.equal(utilityCount, 3, `sheet carries exactly the wanted utilities, got ${utilityCount}`);

  const mode = page.locator('#mode');
  await mode.waitFor();
  const outer = page.locator('#outer');
  await outer.waitFor();

  async function paint(): Promise<string> {
    return mode.evaluate((el) => getComputedStyle(el).color);
  }

  const rested = await paint();
  assert.equal(rested, 'rgb(124, 58, 237)', `no attribute rests on the base color, got ${rested}`);

  await mode.evaluate((el) => {
    el.ownerDocument.documentElement.setAttribute('data-color-mode', 'dark');
  });
  const htmlDark = await paint();
  assert.equal(htmlDark, 'rgb(255, 255, 255)', `html dark paints paper, got ${htmlDark}`);

  await mode.evaluate((el) => {
    el.ownerDocument.documentElement.setAttribute('data-color-mode', 'light');
  });
  const htmlLight = await paint();
  assert.equal(htmlLight, 'rgb(17, 17, 17)', `html light paints ink, got ${htmlLight}`);

  await mode.evaluate((el) => {
    el.ownerDocument.documentElement.removeAttribute('data-color-mode');
  });
  await outer.evaluate((el) => {
    el.setAttribute('data-color-mode', 'dark');
  });
  const nestedDark = await paint();
  assert.equal(nestedDark, 'rgb(255, 255, 255)', `nested dark paints paper, got ${nestedDark}`);

  await outer.evaluate((el) => {
    el.setAttribute('data-color-mode', 'light');
  });
  const nestedLight = await paint();
  assert.equal(nestedLight, 'rgb(17, 17, 17)', `nested light paints ink, got ${nestedLight}`);

  await outer.evaluate((el) => {
    el.removeAttribute('data-color-mode');
  });
  const cleared = await paint();
  assert.equal(cleared, 'rgb(124, 58, 237)', `clearing the wrapper restores the base color, got ${cleared}`);
}
