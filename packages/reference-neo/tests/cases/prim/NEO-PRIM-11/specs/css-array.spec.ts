// css-array.spec.ts — spec for NEO-PRIM-11, the array css prop case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// utility or the unpainted array element on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// Two utilities, one probe, one merge rule. Both array elements mint a
// utility and both paint; the css key itself never lands on the element.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  for (const cls of ['neo-prim11__c_blue\\.300', 'neo-prim11__bg-c_green\\.300']) {
    assert.ok(styles.includes(`.${cls} {`), `sheet carries .${cls}`);
  }
  const utilityCount = styles.match(/\.neo-prim11__/g)?.length ?? 0;
  assert.equal(utilityCount, 2, `sheet carries exactly the wanted utilities, got ${utilityCount}`);

  const node = page.locator('#array');
  await node.waitFor();
  const color = await node.evaluate((el) => getComputedStyle(el).color);
  assert.equal(color, 'rgb(147, 197, 253)', `first array element paints, got ${color}`);
  const background = await node.evaluate((el) => getComputedStyle(el).backgroundColor);
  assert.equal(background, 'rgb(134, 239, 172)', `second array element paints, got ${background}`);

  assert.equal(
    await node.evaluate((el) => el.getAttribute('data-layer')),
    'neo-prim11',
    'array probe stamps the system layer',
  );
  assert.equal(
    await node.evaluate((el) => el.getAttribute('css')),
    null,
    'css prop stays off the array element',
  );
}
