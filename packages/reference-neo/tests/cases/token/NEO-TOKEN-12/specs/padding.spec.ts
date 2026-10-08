// padding.spec.ts — spec for NEO-TOKEN-12, the multi-ref case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the probe
// whose computed padding missed its reference on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

async function paddingOf(page: SpecPage, id: string): Promise<[string, string]> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  return node.evaluate((el) => {
    const style = getComputedStyle(el);
    return [style.paddingTop, style.paddingLeft] as [string, string];
  });
}

// The two-value shorthand splits per side with each ref resolved to its own
// var; nothing brace-shaped survives, and the probe computes the 4px/8px
// pair exactly like its inline reference.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(
    styles.includes('padding-top: var(--spacing-1r)'),
    'sheet resolves the first ref on the block sides',
  );
  assert.ok(
    styles.includes('padding-left: var(--spacing-2r)'),
    'sheet resolves the second ref on the inline sides',
  );
  assert.ok(
    !styles.includes('{spacing.'),
    'sheet leaves no unresolved ref behind',
  );

  const probe = await paddingOf(page, 'probe');
  const ref = await paddingOf(page, 'padding-ref');
  assert.deepEqual(probe, ref, `multi-ref padding computes like its reference, got ${probe} vs ${ref}`);
  assert.deepEqual(probe, ['4px', '8px'], 'the resolved padding paints the 4px/8px pair');
}
