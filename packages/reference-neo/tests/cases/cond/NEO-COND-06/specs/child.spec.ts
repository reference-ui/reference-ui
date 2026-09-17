// child.spec.ts — spec for NEO-COND-06, the child-combinator case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the lost
// combinator, the miscounted utility, or the paragraph that paints on the
// wrong side of the child boundary on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// One utility, one combinator, three paints. The direct p child paints
// brand while the p grandchild and the middle div keep the ink page
// baseline, proving the child combinator survives lowering exactly.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('> p'), 'sheet keeps the child combinator');
  const utilityCount = styles.match(/\.neo-cond-06__/g)?.length ?? 0;
  assert.equal(utilityCount, 1, `sheet carries exactly the wanted utility, got ${utilityCount}`);

  async function paint(selector: string): Promise<string> {
    const probe = page.locator(selector);
    await probe.waitFor();
    return probe.evaluate((el) => getComputedStyle(el).color);
  }

  const child = await paint('#child');
  assert.equal(child, 'rgb(124, 58, 237)', `direct p child paints brand, got ${child}`);

  const grandchild = await paint('#grandchild');
  assert.equal(grandchild, 'rgb(17, 17, 17)', `p grandchild keeps ink, got ${grandchild}`);

  const mid = await paint('#mid');
  assert.equal(mid, 'rgb(17, 17, 17)', `middle div keeps ink, got ${mid}`);
}
