// media.spec.ts — spec for NEO-SITE-09, the string-@media case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// missing at-rule, the selector-shaped leak, or the mispainted width.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

async function computedWidth(page: SpecPage): Promise<string> {
  const target = page.locator('#target');
  await target.waitFor();
  return target.evaluate((el) => getComputedStyle(el).width);
}

// The string key prints a real @media block wrapping the 60px rule — never
// a selector fragment — and the viewport (not a container) gates it: 300px
// paints the flat width, 500px paints the queried width.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('.neo-site-09__w_50px {'), 'sheet carries the flat width');
  const block = /@media \(min-width: 400px\) \{\s*\.neo-site-09__[^{]+\{\s*width: 60px;\s*\}/;
  assert.ok(block.test(styles), 'the @media block wraps the 60px rule');
  const utilityCount = styles.match(/\.neo-site-09__/g)?.length ?? 0;
  assert.equal(utilityCount, 2, `sheet carries exactly the two utilities, got ${utilityCount}`);

  await page.setViewportSize({ width: 300, height: 600 });
  assert.equal(await computedWidth(page), '50px', 'narrow viewport paints the flat width');
  await page.setViewportSize({ width: 500, height: 600 });
  assert.equal(await computedWidth(page), '60px', 'wide viewport paints the queried width');
}
