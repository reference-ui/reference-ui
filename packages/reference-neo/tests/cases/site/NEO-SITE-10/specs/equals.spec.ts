// equals.spec.ts — spec for NEO-SITE-10, the css-prop-equality case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// extra utility, the divergent class string, or the unpainted probe.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

const EXPECTED = 'neo-site-10__mt_8px';

// The css prop and the css call are one site shape: both nodes carry the
// shared class (beside the primitive's own marker), the sheet carries that
// single utility once, and both paint the same margin.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes(`.${EXPECTED} {`), 'sheet carries the shared utility');
  const utilityCount = styles.match(/\.neo-site-10__/g)?.length ?? 0;
  assert.equal(utilityCount, 1, `sheet carries the utility once, got ${utilityCount}`);

  for (const id of ['prop', 'call']) {
    const probe = page.locator(`#${id}`);
    await probe.waitFor();
    // The primitive stamps its ref-div marker beside the shared class.
    assert.ok(
      (await probe.evaluate((el) => (el as HTMLElement).className)).split(' ').includes(EXPECTED),
      `#${id} carries the shared class`,
    );
    assert.equal(
      await probe.evaluate((el) => getComputedStyle(el).marginTop),
      '8px',
      `#${id} paints the shared margin`,
    );
  }
}
