// merge.spec.ts — spec for NEO-MERGE-04, the borderBottom case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// atom, the leaked currentColor, or the mispainted bottom border on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// Border shorthand plus sibling color: width and style atoms emit, no
// currentColor leaks in, and the computed bottom border paints the color.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(!styles.toLowerCase().includes('currentcolor'), 'no currentColor leaks into the sheet');
  assert.ok(styles.includes('.neo-merge-04__bd-b-w_1px {'), 'sheet carries the width atom');
  assert.ok(styles.includes('.neo-merge-04__bd-b-s_solid {'), 'sheet carries the style atom');
  assert.ok(styles.includes('.neo-merge-04__bd-c_slate {'), 'sheet carries the color atom');
  const utilityCount = styles.match(/\.neo-merge-04__/g)?.length ?? 0;
  assert.equal(utilityCount, 3, `sheet carries exactly the wanted utilities, got ${utilityCount}`);

  const edge = page.locator('#edge');
  await edge.waitFor();
  const width = await edge.evaluate((el) => getComputedStyle(el).borderBottomWidth);
  assert.equal(width, '1px', `bottom width paints, got ${width}`);
  const style = await edge.evaluate((el) => getComputedStyle(el).borderBottomStyle);
  assert.equal(style, 'solid', `bottom style paints, got ${style}`);
  const color = await edge.evaluate((el) => getComputedStyle(el).borderBottomColor);
  assert.equal(color, 'rgb(39, 39, 42)', `sibling color paints the bottom, got ${color}`);
}
