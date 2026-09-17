// gradient.spec.ts — spec for NEO-CSS-06, the gradient token-ref case.
// Takes { page, case } from the runner with the world freshly synced and the
// page already navigated to it. Emits nothing on success; throws naming the
// unexpanded ref, the extra utility, or the unpainted gradient.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// One gradient with two token-ref stops. The sheet carries exactly that
// utility with both refs expanded to vars, and the browser paints the
// resolved two-color gradient.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(
    styles.includes('linear-gradient(var(--colors-ember), var(--colors-ocean))'),
    'sheet expands both refs inside the gradient',
  );
  assert.ok(!styles.includes('{colors.ember}'), 'no raw ember ref leaks into the sheet');
  assert.ok(!styles.includes('{colors.ocean}'), 'no raw ocean ref leaks into the sheet');
  const utilityCount = styles.match(/\.neo-css6__/g)?.length ?? 0;
  assert.equal(utilityCount, 1, `sheet carries exactly the gradient utility, got ${utilityCount}`);

  const probe = page.locator('#probe');
  await probe.waitFor();
  const cls = await probe.evaluate((el) => (el as HTMLElement).className);
  assert.equal(cls.split(' ').length, 1, `probe carries one class, got ${cls}`);
  const image = await probe.evaluate((el) => getComputedStyle(el).backgroundImage);
  assert.ok(image.includes('linear-gradient'), `gradient paints, got ${image}`);
  assert.ok(image.includes('rgb(255, 0, 0)'), `ember stop paints red, got ${image}`);
  assert.ok(image.includes('rgb(0, 0, 255)'), `ocean stop paints blue, got ${image}`);
}
