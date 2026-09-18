// comma-scope.spec.ts — spec for NEO-COND-17, the comma-member scoping
// case. Takes { page, case } from the runner with the world freshly synced
// and the page already navigated to it. Emits nothing on success; throws
// naming the unscoping comma, the leaked bare member, or the side of the
// class boundary that paints wrong on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// Two classes, one comma, four paints. The base class appears once and the
// comma class appears on both selectors of a single rule, and the scoped
// host plus its only-child paint brand while an unscoped only-child and
// the first-child control stay ink, proving the bare member scopes under
// the class instead of leaking onto the document.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const hits = styles.match(/\.neo-cond-17__[^{\s,]*/g) ?? [];
  const distinct = new Set(hits);
  assert.equal(distinct.size, 2, `sheet mints base plus comma classes, got ${distinct.size}`);
  assert.equal(hits.length, 3, `base once plus comma twice, got ${hits.length}`);
  assert.match(styles, /:not\(:first-child\),\s*\.neo-cond-17__/, 'both comma members carry the class');
  assert.doesNotMatch(styles, /, :only-child/, 'no bare :only-child member leaks');

  const scoped = page.locator('#scoped');
  await scoped.waitFor();
  const host = await scoped.evaluate((el) => getComputedStyle(el).color);
  assert.equal(host, 'rgb(124, 58, 237)', `scoped non-first-child paints brand, got ${host}`);

  const kid = await page.locator('#kid').evaluate((el) => getComputedStyle(el).color);
  assert.equal(kid, 'rgb(124, 58, 237)', `scoped only-child paints brand, got ${kid}`);

  const solo = await page.locator('#solo').evaluate((el) => getComputedStyle(el).color);
  assert.equal(solo, 'rgb(17, 17, 17)', `unscoped only-child stays ink, got ${solo}`);

  const first = await page.locator('#first').evaluate((el) => getComputedStyle(el).color);
  assert.equal(first, 'rgb(17, 17, 17)', `first-child control stays ink, got ${first}`);
}
