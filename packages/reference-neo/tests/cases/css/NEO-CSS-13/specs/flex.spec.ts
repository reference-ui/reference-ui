// flex.spec.ts — spec for NEO-CSS-13, the flex utility-values case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// mistripled keyword, the decomposed longhand, or the mispainted basis.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

async function flexOf(page: SpecPage, id: string): Promise<[string, string, string]> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  return node.evaluate((el): [string, string, string] => {
    const style = getComputedStyle(el);
    return [style.flexGrow, style.flexShrink, style.flexBasis];
  });
}

// Panda flex utility values: the four keywords map to triples, the rest
// print raw, nothing decomposes, and the computed basis split paints.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('flex: 1 1 0%;'), 'sheet maps flex 1 to the triple');
  assert.ok(styles.includes('flex: 1 1 auto;'), 'sheet maps flex auto to the triple');
  assert.ok(styles.includes('flex: 0 1 auto;'), 'sheet maps flex initial to the triple');
  assert.ok(styles.includes('flex: none;'), 'sheet keeps flex none bare');
  assert.ok(styles.includes('flex: 0 0 auto;'), 'sheet prints 0 0 auto raw');
  assert.ok(styles.includes('flex: 2 30px;'), 'sheet prints 2 30px raw');
  assert.ok(!styles.includes('flex-grow:'), 'no flex-grow longhand leaks');
  assert.ok(!styles.includes('flex-shrink:'), 'no flex-shrink longhand leaks');
  assert.ok(!styles.includes('flex-basis:'), 'no flex-basis longhand leaks');
  const utilityCount = styles.match(/\.neo-css13__/g)?.length ?? 0;
  assert.equal(utilityCount, 7, `sheet carries exactly the seven utilities, got ${utilityCount}`);

  const one = page.locator('#one');
  await one.waitFor();
  const oneClass = await one.evaluate((el) => (el as HTMLElement).className);
  assert.ok(oneClass.includes('flex_1_1_0'), `the 1 item carries the triple class, got ${oneClass}`);

  assert.deepEqual(await flexOf(page, 'one'), ['1', '1', '0%'], 'flex 1 paints grow/shrink 1, basis 0%');
  assert.deepEqual(await flexOf(page, 'zero'), ['0', '0', 'auto'], 'flex 0 0 auto paints basis auto');
  assert.deepEqual(await flexOf(page, 'auto'), ['1', '1', 'auto'], 'flex auto paints 1 1 auto');
  assert.deepEqual(await flexOf(page, 'initial'), ['0', '1', 'auto'], 'flex initial paints 0 1 auto');
  assert.deepEqual(await flexOf(page, 'none'), ['0', '0', 'auto'], 'flex none paints 0 0 auto');
  assert.deepEqual(await flexOf(page, 'grow'), ['2', '1', '30px'], 'flex 2 30px paints grow 2, basis 30px');
}
