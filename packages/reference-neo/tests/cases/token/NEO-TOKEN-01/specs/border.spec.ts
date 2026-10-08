// border.spec.ts — spec for NEO-TOKEN-01, the shorthand token-ref case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the probe
// whose computed border missed its reference on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

async function borderOf(page: SpecPage, id: string): Promise<[string, string, string]> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  return node.evaluate((el) => {
    const style = getComputedStyle(el);
    return [style.borderTopColor, style.borderTopStyle, style.borderTopWidth] as [string, string, string];
  });
}

// The engine splits the border shorthand into longhands; the token segment
// must resolve to var(--colors-red-500) while the width and style literals
// pass through. The probe must compute exactly like the hex reference.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(
    styles.includes('border-color: var(--colors-red-500)'),
    'sheet resolves the shorthand ref to var(--colors-red-500)',
  );
  assert.ok(styles.includes('border-style: solid'), 'sheet keeps the style literal');
  assert.ok(styles.includes('border-width: 2px'), 'sheet keeps the width literal');
  assert.ok(
    !styles.includes('{colors.red.500}'),
    'sheet leaves no unresolved ref behind',
  );

  const probe = await borderOf(page, 'probe');
  const ref = await borderOf(page, 'border-ref');
  assert.deepEqual(probe, ref, `shorthand ref computes like the hex reference, got ${probe} vs ${ref}`);
  assert.equal(probe[0], 'rgb(239, 68, 68)', 'the resolved border paints the token red');
}
