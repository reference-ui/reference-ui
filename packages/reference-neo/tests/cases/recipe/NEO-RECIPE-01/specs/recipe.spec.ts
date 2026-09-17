// recipe.spec.ts — spec for NEO-RECIPE-01, the recipe variant case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// recipe class, the misresolved selection, or the unpainted probe on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import type { NativeRuntimeArtifact } from '@reference-ui/rust/contracts';
import { recipe, registerRecipeData } from '@reference-ui/neo/runtime';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

interface RuntimeDataModule {
  systemName: string;
  runtimeData: NativeRuntimeArtifact;
}

const STEM = 'neo-recipe__button';

const EXPECTED_CLASSES = [
  `${STEM}__base`,
  `${STEM}_t_accent`,
  `${STEM}_t_muted`,
  `${STEM}_s_sm`,
  `${STEM}_s_lg`,
  `${STEM}_c_accent_lg`,
];

// Extraction compiled the recipe into six closed classes under the recipes
// layer. Resolution runs through the pre-composed combinations, and each
// selection paints its own computed styles in the browser.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes('@layer recipes'), 'sheet carries the recipes layer');
  for (const cls of EXPECTED_CLASSES) {
    assert.ok(styles.includes(`.${cls}`), `sheet carries .${cls}`);
  }
  const recipeCount = styles.match(/\.neo-recipe__/g)?.length ?? 0;
  assert.equal(recipeCount, 6, `sheet carries exactly the recipe classes, got ${recipeCount}`);

  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  registerRecipeData(data.systemName, data.runtimeData.recipes);
  const button = recipe({
    className: 'button',
    defaultVariants: { tone: 'muted', size: 'sm' },
  });
  assert.equal(
    button({ tone: 'accent', size: 'lg' }),
    `${STEM}__base ${STEM}_t_accent ${STEM}_s_lg ${STEM}_c_accent_lg`,
    'accent+lg resolves through the pre-composed combination',
  );
  assert.equal(
    button(),
    `${STEM}__base ${STEM}_t_muted ${STEM}_s_sm`,
    'bare call fills every axis from defaults',
  );

  const accent = page.locator('#accent');
  await accent.waitFor();
  assert.equal(
    await accent.evaluate((el) => getComputedStyle(el).color),
    'rgb(124, 58, 237)',
    'accent paints brand text',
  );
  assert.equal(
    await accent.evaluate((el) => getComputedStyle(el).paddingTop),
    '8px',
    'sm paints small padding',
  );
  assert.equal(
    await accent.evaluate((el) => getComputedStyle(el).backgroundColor),
    'rgba(0, 0, 0, 0)',
    'compound stays off when only one predicate holds',
  );

  const combo = page.locator('#combo');
  await combo.waitFor();
  assert.equal(
    await combo.evaluate((el) => getComputedStyle(el).backgroundColor),
    'rgb(17, 17, 17)',
    'compound fires when both predicates hold',
  );
  assert.equal(
    await combo.evaluate((el) => getComputedStyle(el).paddingTop),
    '32px',
    'lg paints large padding',
  );

  const muted = page.locator('#muted');
  await muted.waitFor();
  assert.equal(
    await muted.evaluate((el) => getComputedStyle(el).color),
    'rgb(255, 255, 255)',
    'muted paints paper text over the ink base',
  );

  const defaults = page.locator('#defaults');
  await defaults.waitFor();
  assert.equal(
    await defaults.evaluate((el) => getComputedStyle(el).color),
    'rgb(255, 255, 255)',
    'defaults paint muted paper text',
  );
  assert.equal(
    await defaults.evaluate((el) => getComputedStyle(el).paddingTop),
    '8px',
    'defaults paint sm padding',
  );
}
