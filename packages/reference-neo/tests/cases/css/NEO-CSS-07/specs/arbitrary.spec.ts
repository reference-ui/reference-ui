// arbitrary.spec.ts — spec for NEO-CSS-07, the arbitrary-value case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the split
// utility, the mangled function, or the unpainted probe.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

async function singleClass(page: SpecPage, selector: string): Promise<string> {
  const probe = page.locator(selector);
  await probe.waitFor();
  const cls = await probe.evaluate((el) => (el as HTMLElement).className);
  assert.equal(cls.split(' ').length, 1, `${selector} carries one class, got ${cls}`);
  return cls;
}

// Three arbitrary spellings, one probe each. The sheet carries exactly the
// three utilities with the functions intact, each probe carries a single
// class, and each paints.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('color: rgba(255,255,255,0.04);'), 'sheet keeps the rgba function intact');
  assert.ok(
    styles.includes('background-color: color-mix(in oklch, currentColor 14%, transparent);'),
    'sheet keeps the color-mix function intact',
  );
  assert.ok(styles.includes('width: calc(100% - 8px);'), 'sheet keeps the calc function intact');
  const utilityCount = styles.match(/\.neo-css7__/g)?.length ?? 0;
  assert.equal(utilityCount, 3, `sheet carries exactly the three utilities, got ${utilityCount}`);

  await singleClass(page, '#rgba');
  const rgba = page.locator('#rgba');
  const color = await rgba.evaluate((el) => getComputedStyle(el).color);
  assert.equal(color, 'rgba(255, 255, 255, 0.04)', `rgba paints, got ${color}`);

  await singleClass(page, '#mix');
  const mix = page.locator('#mix');
  const background = await mix.evaluate((el) => getComputedStyle(el).backgroundColor);
  assert.notEqual(background, 'rgba(0, 0, 0, 0)', `color-mix paints over transparent, got ${background}`);
  assert.ok(background.includes('0.14'), `color-mix keeps the 14% alpha, got ${background}`);

  await singleClass(page, '#calc');
  const calc = page.locator('#calc');
  const width = await calc.evaluate((el) => getComputedStyle(el).width);
  assert.equal(width, '192px', `calc resolves against the 200px parent, got ${width}`);
}
