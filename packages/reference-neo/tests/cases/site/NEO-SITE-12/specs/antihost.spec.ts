// antihost.spec.ts — spec for NEO-SITE-12, the anti-host case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming any
// minted ghost utility, any classed probe, or the unpainted control.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// Hosts come from imports plus jsxElements, never PascalCase guessing and
// never lowercase tags: the sheet carries only the control utility, both
// probes stay classless and unpainted, and the control paints its margin.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('.neo-site-12__mt_8px {'), 'sheet carries the control utility');
  assert.ok(!styles.includes('fs_12px'), 'no Random font-size ghost reaches the sheet');
  assert.ok(!styles.includes('c_red'), 'no lowercase color ghost reaches the sheet');
  const utilityCount = styles.match(/\.neo-site-12__/g)?.length ?? 0;
  assert.equal(utilityCount, 1, `sheet carries only the control utility, got ${utilityCount}`);

  for (const id of ['random', 'lower']) {
    const probe = page.locator(`#${id}`);
    await probe.waitFor();
    assert.equal(
      await probe.evaluate((el) => (el as HTMLElement).className),
      '',
      `#${id} carries no class`,
    );
  }
  const lower = page.locator('#lower');
  await lower.waitFor();
  assert.equal(
    await lower.evaluate((el) => getComputedStyle(el).color),
    'rgb(0, 0, 0)',
    'the lowercase probe paints no color',
  );
  const control = page.locator('#control');
  await control.waitFor();
  assert.equal(
    await control.evaluate((el) => getComputedStyle(el).marginTop),
    '8px',
    'the control paints its margin',
  );
}
