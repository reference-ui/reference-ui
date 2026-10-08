// rescale.spec.ts — spec for NEO-TOKEN-15, the rescale-knob case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the probe
// whose computed padding missed its doubled reference on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

const ROOT_DEFAULT = '@layer root {\n  :root { --spacing-root: 0.25rem }\n}\n';

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

async function paddingOf(page: SpecPage, id: string): Promise<string> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  return node.evaluate((el) => getComputedStyle(el).paddingTop);
}

// The author's one-line `:root` of `0.5rem` outranks the baked default, so
// the calc and bare-var lowerings both paint doubled against inline refs.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(
    styles.startsWith(ROOT_DEFAULT),
    'sheet still opens with the baked default',
  );
  assert.equal(
    countOccurrences(styles, '--spacing-root:'),
    2,
    'sheet defines the root exactly twice: baked default plus author',
  );
  assert.ok(
    styles.includes('--spacing-root: 0.5rem'),
    'sheet carries the author rescale value',
  );
  assert.ok(
    styles.indexOf('@layer global {') < styles.indexOf('--spacing-root: 0.5rem') &&
      styles.indexOf('--spacing-root: 0.5rem') < styles.indexOf('@layer utilities {'),
    'the author root rides the own package global layer',
  );
  assert.ok(
    styles.includes('padding: calc(4 * var(--spacing-root))'),
    'sheet lowers 4r to a root calc',
  );
  assert.ok(
    styles.includes('padding: var(--spacing-root)'),
    'sheet lowers 1r to the bare root var',
  );

  const root = await page.locator('html').evaluate(
    (el) => getComputedStyle(el).getPropertyValue('--spacing-root').trim(),
  );
  assert.equal(root, '0.5rem', `author root applies, got ${root}`);

  const quad = await paddingOf(page, 'quad');
  const quadRef = await paddingOf(page, 'quad-ref');
  assert.equal(quad, quadRef, `4r computes like its reference, got ${quad} vs ${quadRef}`);
  assert.equal(quad, '32px', 'quad rhythm paints doubled at the rescaled root');

  const unit = await paddingOf(page, 'unit');
  const unitRef = await paddingOf(page, 'unit-ref');
  assert.equal(unit, unitRef, `1r computes like its reference, got ${unit} vs ${unitRef}`);
  assert.equal(unit, '8px', 'unit rhythm paints doubled at the rescaled root');
}
