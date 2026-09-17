// array.spec.ts — spec for NEO-PRIM-04, the array-prop case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// container rule, the unresolved array slot, or the mispainted probe on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

async function paddingOf(page: SpecPage, id: string): Promise<string> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  return node.evaluate((el) => getComputedStyle(el).paddingTop);
}

// Three utilities, five probes, two arrays. The two-step probe paints 1r at
// base and 2r from sm up, live-resizing both ways; the holed probe keeps the
// base step through the sm range and jumps to 4r at md. The hole mints no
// rule, so the utility count stays at three.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('@container (min-width: 640px)'), 'sheet carries the sm container rule');
  assert.ok(styles.includes('@container (min-width: 768px)'), 'sheet carries the md container rule');
  assert.ok(styles.includes('--spacing-root: 0.25rem'), 'sheet carries the rhythm root');
  const utilityCount = styles.match(/\.neo-prim4__/g)?.length ?? 0;
  assert.equal(utilityCount, 3, `sheet carries exactly the wanted utilities, got ${utilityCount}`);

  assert.equal(await paddingOf(page, 'narrow-probe'), '4px', 'narrow container paints 1r');
  assert.equal(await paddingOf(page, 'wide-probe'), '8px', 'wide container paints 2r');

  const live = page.locator('#live');
  await live.waitFor();
  assert.equal(await paddingOf(page, 'live-probe'), '4px', 'live container starts at 1r');
  await live.evaluate((el) => {
    el.style.width = '800px';
  });
  assert.equal(await paddingOf(page, 'live-probe'), '8px', 'widening the container paints 2r');
  await live.evaluate((el) => {
    el.style.width = '400px';
  });
  assert.equal(await paddingOf(page, 'live-probe'), '4px', 'narrowing the container restores 1r');

  assert.equal(await paddingOf(page, 'hole-sm-probe'), '4px', 'holed probe keeps 1r through the sm range');
  assert.equal(await paddingOf(page, 'hole-md-probe'), '16px', 'holed probe paints 4r at md');

  const probe = page.locator('#narrow-probe');
  await probe.waitFor();
  assert.equal(
    await probe.evaluate((el) => el.getAttribute('data-layer')),
    'neo-prim4',
    'probe stamps the system layer',
  );
  assert.equal(
    await probe.evaluate((el) => el.getAttribute('p')),
    null,
    'array style props stay off the element',
  );
}
