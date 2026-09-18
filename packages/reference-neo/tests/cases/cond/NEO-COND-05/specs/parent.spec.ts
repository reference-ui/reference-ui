// parent.spec.ts — spec for NEO-COND-05, the hovered-input parent-key case.
// Takes { page, case } from the runner with the world freshly synced and the
// page already navigated to it. Emits nothing on success; throws naming the
// dropped parent key, the ghost utility, or the half that refuses to rest on
// ink on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// Two classes, one ancestor, two inks. The sheet mints a base utility plus one
// conditioned utility whose selector composes the hovered-input ancestor, and
// both halves rest on ink with the input provably unhovered — the P11 lateral
// (SpecPage offers no hover, so the positive arm is sheet-proven).
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const hits = styles.match(/\.neo-cond-05__[^{\s,]*/g) ?? [];
  const distinct = new Set(hits);
  assert.equal(distinct.size, 2, `sheet mints base plus conditioned classes, got ${distinct.size}`);
  assert.equal(hits.length, 2, `base once plus conditioned once, got ${hits.length}`);
  assert.ok(styles.includes('input:hover .neo-cond-05__'), 'sheet composes the hovered-input ancestor');
  assert.match(styles, /color: (var\(--colors-brand\)|#7c3aed)/, 'conditioned utility carries brand');

  const field = page.locator('#field');
  await field.waitFor();
  assert.equal(await field.evaluate((el) => el.matches(':hover')), false, 'input starts unhovered');

  async function paint(selector: string): Promise<string> {
    const probe = page.locator(selector);
    await probe.waitFor();
    return probe.evaluate((el) => getComputedStyle(el).color);
  }

  const sibling = await paint('#sibling');
  assert.equal(sibling, 'rgb(17, 17, 17)', `sibling rests on ink with the input unhovered, got ${sibling}`);

  const plain = await paint('#plain');
  assert.equal(plain, 'rgb(17, 17, 17)', `plain control rests on ink, got ${plain}`);
}
