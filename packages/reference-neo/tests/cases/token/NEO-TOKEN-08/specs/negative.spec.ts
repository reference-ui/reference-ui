// negative.spec.ts — spec for NEO-TOKEN-08, the negative-values case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the probe
// whose computed margin missed its reference on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

async function marginOf(page: SpecPage, id: string): Promise<string> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  return node.evaluate((el) => getComputedStyle(el).marginTop);
}

// The named token negates its var while rhythm negates the root at two
// scales; class names keep the minus, and every probe computes its
// negative pixels like its inline reference.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(
    styles.includes('margin-top: calc(-1 * var(--spacing-sm))'),
    'sheet negates the named token var',
  );
  assert.ok(
    styles.includes('margin-top: calc(-1 * var(--spacing-root))'),
    'sheet negates the rhythm root',
  );
  assert.ok(
    styles.includes('margin-top: calc(-4 * var(--spacing-root))'),
    'sheet negates the scaled rhythm root',
  );
  assert.ok(styles.includes('mt_-sm'), 'the token class keeps the minus');
  assert.ok(styles.includes('mt_-1r'), 'the rhythm class keeps the minus');
  assert.ok(styles.includes('mt_-4r'), 'the scaled class keeps the minus');

  const tokenNeg = await marginOf(page, 'token-neg');
  const tokenRef = await marginOf(page, 'token-ref');
  assert.equal(tokenNeg, tokenRef, `-sm computes like its reference, got ${tokenNeg} vs ${tokenRef}`);
  assert.equal(tokenNeg, '-8px', 'the negated token paints -8px');

  const rhythmNeg = await marginOf(page, 'rhythm-neg');
  const rhythmRef = await marginOf(page, 'rhythm-ref');
  assert.equal(rhythmNeg, rhythmRef, `-1r computes like its reference, got ${rhythmNeg} vs ${rhythmRef}`);
  assert.equal(rhythmNeg, '-4px', 'negated rhythm paints -4px');

  const scaledNeg = await marginOf(page, 'scaled-neg');
  const scaledRef = await marginOf(page, 'scaled-ref');
  assert.equal(scaledNeg, scaledRef, `-4r computes like its reference, got ${scaledNeg} vs ${scaledRef}`);
  assert.equal(scaledNeg, '-16px', 'negated scaled rhythm paints -16px');
}
