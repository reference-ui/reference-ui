// twins.spec.ts — spec for NEO-GLOBAL-03, the button twins case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// twin, the unflattened slot, or the unpainted state on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The world authored one .ref-button rule with a nested slot selector and three
// interaction twins. The sheet carries the flattened slot plus the exact twin
// lists, and each state paints computed: the slot offset, the real disabled
// attribute, the hover twin, and the focus-visible twin.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const globalOpen = styles.indexOf('@layer global {');
  assert.ok(globalOpen !== -1, 'sheet carries @layer global');
  const globalLayer = styles.slice(globalOpen);
  assert.ok(
    globalLayer.includes('.ref-button > [data-slot="icon"]'),
    'global layer flattens the nested slot selector',
  );
  for (const twin of [
    '.ref-button:is(:disabled, [disabled], [data-disabled], [aria-disabled=true])',
    '.ref-button:is(:hover, [data-hover])',
    '.ref-button:is(:focus-visible, [data-focus-visible])',
  ]) {
    assert.ok(globalLayer.includes(twin), `global layer carries ${twin}`);
  }

  const base = page.locator('#base');
  await base.waitFor();
  const baseBorder = await base.evaluate((el) => getComputedStyle(el).borderColor);
  assert.equal(baseBorder, 'rgb(17, 17, 17)', `base paints its border, got ${baseBorder}`);

  const icon = page.locator('#icon');
  await icon.waitFor();
  const slotMargin = await icon.evaluate((el) => getComputedStyle(el).marginLeft);
  assert.equal(slotMargin, '-5px', `nested slot paints the offset, got ${slotMargin}`);

  const disabled = page.locator('#disabled');
  await disabled.waitFor();
  const disabledColor = await disabled.evaluate((el) => getComputedStyle(el).color);
  assert.equal(disabledColor, 'rgb(107, 114, 128)', `disabled paints its text, got ${disabledColor}`);
  const disabledBg = await disabled.evaluate((el) => getComputedStyle(el).backgroundColor);
  assert.equal(disabledBg, 'rgb(229, 231, 235)', `disabled paints its field, got ${disabledBg}`);

  const hovered = page.locator('#hovered');
  await hovered.waitFor();
  const hoverBorder = await hovered.evaluate((el) => getComputedStyle(el).borderColor);
  assert.equal(hoverBorder, 'rgb(59, 130, 246)', `hover twin paints the border, got ${hoverBorder}`);

  const focused = page.locator('#focused');
  await focused.waitFor();
  const ring = await focused.evaluate((el) => getComputedStyle(el).outlineColor);
  assert.equal(ring, 'rgb(124, 58, 237)', `focus twin paints the ring, got ${ring}`);
  const ringWidth = await focused.evaluate((el) => getComputedStyle(el).outlineWidth);
  assert.equal(ringWidth, '2px', `focus twin paints the width, got ${ringWidth}`);
}
