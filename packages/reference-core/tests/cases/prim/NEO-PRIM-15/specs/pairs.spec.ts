// pairs.spec.ts — spec for NEO-PRIM-15, the corner-pair shorthands case.
// Takes { page, case } from the runner with the world freshly synced and the
// page already navigated to it. Emits nothing on success; throws naming the
// pair or corner that fails to resolve to 8px.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

type Corner = 'borderTopLeftRadius' | 'borderTopRightRadius' | 'borderBottomLeftRadius' | 'borderBottomRightRadius';

async function corners(page: SpecPage, id: string): Promise<Record<Corner, string>> {
  const probe = page.locator(`#${id}`);
  await probe.waitFor();
  return probe.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      borderTopLeftRadius: style.borderTopLeftRadius,
      borderTopRightRadius: style.borderTopRightRadius,
      borderBottomLeftRadius: style.borderBottomLeftRadius,
      borderBottomRightRadius: style.borderBottomRightRadius,
    };
  });
}

// Six pairs, twelve corners. Each physical pair paints 8px on exactly its
// two addressed corners; each logical pair paints 8px on its LTR corners.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('border-top-left-radius'), 'sheet carries expanded corner longhands');

  const top = await corners(page, 'radius-top-pair');
  assert.equal(top.borderTopLeftRadius, '8px', 'top pair paints the top-left corner');
  assert.equal(top.borderTopRightRadius, '8px', 'top pair paints the top-right corner');

  const bottom = await corners(page, 'radius-bottom-pair');
  assert.equal(bottom.borderBottomLeftRadius, '8px', 'bottom pair paints the bottom-left corner');
  assert.equal(bottom.borderBottomRightRadius, '8px', 'bottom pair paints the bottom-right corner');

  const left = await corners(page, 'radius-left-pair');
  assert.equal(left.borderTopLeftRadius, '8px', 'left pair paints the top-left corner');
  assert.equal(left.borderBottomLeftRadius, '8px', 'left pair paints the bottom-left corner');

  const right = await corners(page, 'radius-right-pair');
  assert.equal(right.borderTopRightRadius, '8px', 'right pair paints the top-right corner');
  assert.equal(right.borderBottomRightRadius, '8px', 'right pair paints the bottom-right corner');

  const start = await corners(page, 'radius-start-pair');
  assert.equal(start.borderTopLeftRadius, '8px', 'start pair paints the top-left corner in LTR');
  assert.equal(start.borderBottomLeftRadius, '8px', 'start pair paints the bottom-left corner in LTR');

  const end = await corners(page, 'radius-end-pair');
  assert.equal(end.borderTopRightRadius, '8px', 'end pair paints the top-right corner in LTR');
  assert.equal(end.borderBottomRightRadius, '8px', 'end pair paints the bottom-right corner in LTR');
}
