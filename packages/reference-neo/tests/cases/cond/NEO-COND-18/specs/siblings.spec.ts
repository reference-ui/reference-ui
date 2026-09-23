// siblings.spec.ts — spec for NEO-COND-18, the sibling-combinators case.
// Takes { page, case } from the runner with the world freshly synced and the
// page already navigated to it. Emits nothing on success; throws naming the
// lost combinator, the miscounted utility, or the sibling that paints on the
// wrong side of the combinator boundary on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

async function computed(page: SpecPage, selector: string, read: (el: Element) => string): Promise<string> {
  const probe = page.locator(selector);
  await probe.waitFor();
  return probe.evaluate(read);
}

// Two utilities, two combinators, four paints. The adjacent peer paints the
// margin while its leader stays flush; the overlay past the spacer paints
// the padding while the spacer stays flat.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('+ [data-slot=peer]'), 'sheet keeps the adjacent combinator');
  assert.ok(styles.includes('~ [data-slot=overlay]'), 'sheet keeps the general combinator');
  const utilityCount = styles.match(/\.neo-cond18__/g)?.length ?? 0;
  assert.equal(utilityCount, 2, `sheet carries exactly the two utilities, got ${utilityCount}`);

  assert.equal(
    await computed(page, '#adjacent-peer', (el) => getComputedStyle(el).marginLeft),
    '14px',
    'adjacent peer paints the margin',
  );
  assert.equal(
    await computed(page, '#adjacent-leader', (el) => getComputedStyle(el).marginLeft),
    '0px',
    'adjacent leader stays flush',
  );
  assert.equal(
    await computed(page, '#general-overlay', (el) => getComputedStyle(el).paddingTop),
    '15px',
    'general overlay paints the padding',
  );
  assert.equal(
    await computed(page, '#general-spacer', (el) => getComputedStyle(el).paddingTop),
    '0px',
    'spacer between leader and overlay stays flat',
  );
}
