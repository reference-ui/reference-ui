// rhythm.spec.ts — spec for NEO-TOKEN-07, the rhythm-escape case. Takes
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

async function paddingOf(page: SpecPage, id: string): Promise<string> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  return node.evaluate((el) => getComputedStyle(el).paddingTop);
}

// The named decimal resolves through its kebab var while rhythm sugar
// lowers to root calc; every selector escapes its dot or slash, and all
// three probes compute 2px like their inline references.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(
    styles.includes('--spacing-0-5: 0.125rem'),
    'sheet prints the decimal token key as a kebab var',
  );
  assert.ok(
    styles.includes('padding: var(--spacing-0-5)'),
    'the named utility consumes the kebab var',
  );
  assert.ok(
    styles.includes('padding: calc(0.5 * var(--spacing-root))'),
    'sheet lowers 0.5r to a root calc',
  );
  assert.ok(
    styles.includes('padding: calc(var(--spacing-root) / 2)'),
    'sheet lowers 1/2r to a root division',
  );
  assert.ok(styles.includes('p_0\\.5'), 'sheet escapes the decimal class dot');
  assert.ok(styles.includes('p_0\\.5r'), 'sheet escapes the rhythm class dot');
  assert.ok(styles.includes('p_1\\/2r'), 'sheet escapes the fraction class slash');
  assert.ok(
    !styles.includes('--spacing-1/2r'),
    'sheet carries no invalid slash var',
  );

  const named = await paddingOf(page, 'named');
  const namedRef = await paddingOf(page, 'named-ref');
  assert.equal(named, namedRef, `named decimal computes like its reference, got ${named} vs ${namedRef}`);
  assert.equal(named, '2px', 'the named decimal paints 2px');

  const rhythmRef = await paddingOf(page, 'rhythm-ref');
  const decimal = await paddingOf(page, 'decimal');
  assert.equal(decimal, rhythmRef, `0.5r computes like the rhythm reference, got ${decimal} vs ${rhythmRef}`);
  const fraction = await paddingOf(page, 'fraction');
  assert.equal(fraction, rhythmRef, `1/2r computes like the rhythm reference, got ${fraction} vs ${rhythmRef}`);
  assert.equal(decimal, '2px', 'decimal rhythm paints 2px');
  assert.equal(fraction, '2px', 'fraction rhythm paints 2px');
}
