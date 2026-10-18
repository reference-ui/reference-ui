// focus-parent.spec.ts — spec for NEO-COND-10, the focused-parent case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the dropped
// parent key, the ghost utility, or the focus state whose paint is wrong on
// failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// Two classes, one parent, five paints. The sheet mints a base utility plus one
// conditioned utility whose selector hangs the child under any focused parent,
// and the child rests on ink, paints brand while its own parent holds focus,
// returns to ink when focus moves to an unrelated control, repaints on return,
// and rests again after blur — so the arm gates on the parent's focus exactly.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const hits = styles.match(/\.neo-cond-10__[^{\s,]*/g) ?? [];
  const distinct = new Set(hits);
  assert.equal(distinct.size, 2, `sheet mints base plus conditioned classes, got ${distinct.size}`);
  assert.equal(hits.length, 2, `base once plus conditioned once, got ${hits.length}`);
  assert.ok(styles.includes(':focus > .neo-cond-10__'), 'sheet composes the focused-parent selector');
  assert.match(styles, /color: (var\(--colors-brand\)|#7c3aed)/, 'conditioned utility carries brand');

  async function paint(selector: string): Promise<string> {
    const probe = page.locator(selector);
    await probe.waitFor();
    return probe.evaluate((el) => getComputedStyle(el).color);
  }

  const parent = page.locator('#parent');
  await parent.waitFor();
  const other = page.locator('#other');
  await other.waitFor();

  const rested = await paint('#child');
  assert.equal(rested, 'rgb(17, 17, 17)', `child rests on ink, got ${rested}`);

  await parent.evaluate((el) => el.focus());
  const focused = await paint('#child');
  assert.equal(focused, 'rgb(124, 58, 237)', `child paints brand while the parent holds focus, got ${focused}`);

  await other.evaluate((el) => el.focus());
  const moved = await paint('#child');
  assert.equal(moved, 'rgb(17, 17, 17)', `focus on an unrelated control restores ink, got ${moved}`);

  await parent.evaluate((el) => el.focus());
  const returned = await paint('#child');
  assert.equal(returned, 'rgb(124, 58, 237)', `returning focus repaints brand, got ${returned}`);

  await parent.evaluate((el) => el.blur());
  const blurred = await paint('#child');
  assert.equal(blurred, 'rgb(17, 17, 17)', `blur restores ink, got ${blurred}`);
}
