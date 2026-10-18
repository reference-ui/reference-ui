// order.spec.ts — spec for NEO-LAYER-01, the six-layer order case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// order statement, the unomitted empty layer, or the mispainted probe.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The world declared a light/dark brand token, a (0,2,0) tag recipe in the
// global layer, and utility probes over both. The sheet names all six layers
// in rank order with the reset present (static core mirror) and the empty
// base and recipes bodies omitted; the dark probe paints the utility var
// over the token island, the chipped utility paints brand over the more
// specific tag rule, and the bare chip control paints the tag colour so the
// global rule is proven live.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(
    styles.includes('@layer reset, global, base, tokens, recipes, utilities;'),
    'sheet names all six layers in rank order',
  );
  assert.ok(
    styles.includes('@layer reset {') && styles.includes('box-sizing: border-box'),
    'reset layer prints the static core mirror',
  );
  for (const layer of ['base', 'recipes']) {
    assert.ok(
      !styles.includes(`@layer ${layer} {`),
      `empty ${layer} body stays omitted`,
    );
  }
  for (const layer of ['global', 'tokens', 'utilities']) {
    assert.ok(
      styles.includes(`@layer ${layer} {`),
      `populated ${layer} layer prints`,
    );
  }
  const utilitiesOpen = styles.indexOf('@layer utilities {');
  const utilities = styles.slice(utilitiesOpen);
  assert.ok(
    utilities.includes('--colors-brand: #00aa00'),
    'utilities layer carries the var override',
  );

  const varprobe = page.locator('#varprobe');
  await varprobe.waitFor();
  assert.equal(
    await varprobe.evaluate((el) => getComputedStyle(el).color),
    'rgb(0, 170, 0)',
    'dark probe paints the utility var over the token island',
  );
  assert.equal(
    await varprobe.evaluate((el) => getComputedStyle(el).getPropertyValue('--colors-brand').trim()),
    '#00aa00',
    'utility var wins the token-layer value by rank',
  );

  const darkcontrol = page.locator('#darkcontrol');
  await darkcontrol.waitFor();
  assert.equal(
    await darkcontrol.evaluate((el) => getComputedStyle(el).color),
    'rgb(245, 245, 245)',
    'dark control paints the token island value',
  );

  const toneprobe = page.locator('#toneprobe');
  await toneprobe.waitFor();
  assert.equal(
    await toneprobe.evaluate((el) => getComputedStyle(el).color),
    'rgb(17, 17, 17)',
    '(0,1,0) utility beats the (0,2,0) tag rule by layer rank',
  );

  const tonecontrol = page.locator('#tonecontrol');
  await tonecontrol.waitFor();
  assert.equal(
    await tonecontrol.evaluate((el) => getComputedStyle(el).color),
    'rgb(255, 0, 0)',
    'bare chip control paints the tag colour',
  );
}
