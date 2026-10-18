// units.spec.ts — spec for NEO-CSS-04, the unitless-number policy case.
// Takes { page, case } from the runner with the world freshly synced and the
// page already navigated to it. Emits nothing on success; throws naming the
// mis-unitized declaration, the missing utility, or the unpainted probe.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// One numeric leaf per unit policy. The sheet carries exactly the four
// utilities with px only on the width, and each declaration paints.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('width: 42px;'), 'sheet gains px on the dimensional width');
  assert.ok(styles.includes('opacity: 1;'), 'sheet keeps opacity bare');
  assert.ok(styles.includes('z-index: 0;'), 'sheet keeps zero z-index bare');
  assert.ok(styles.includes('--foo: 42;'), 'sheet keeps the custom property bare');
  assert.ok(!styles.includes('opacity: 1px'), 'opacity never takes px');
  assert.ok(!styles.includes('z-index: 0px'), 'z-index never takes px');
  assert.ok(!styles.includes('--foo: 42px'), 'custom properties never take px');
  const utilityCount = styles.match(/\.neo-css4__/g)?.length ?? 0;
  assert.equal(utilityCount, 4, `sheet carries exactly the four utilities, got ${utilityCount}`);

  const probe = page.locator('#probe');
  await probe.waitFor();
  const cls = await probe.evaluate((el) => (el as HTMLElement).className);
  assert.equal(cls.split(' ').length, 4, `probe carries four classes, got ${cls}`);
  const width = await probe.evaluate((el) => getComputedStyle(el).width);
  assert.equal(width, '42px', `width paints 42px, got ${width}`);
  const opacity = await probe.evaluate((el) => getComputedStyle(el).opacity);
  assert.equal(opacity, '1', `opacity paints 1, got ${opacity}`);
  const zIndex = await probe.evaluate((el) => getComputedStyle(el).zIndex);
  assert.equal(zIndex, '0', `z-index paints 0, got ${zIndex}`);
  const foo = await probe.evaluate((el) => getComputedStyle(el).getPropertyValue('--foo').trim());
  assert.equal(foo, '42', `custom property paints 42, got ${foo}`);
}
