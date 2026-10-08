// defaults.spec.ts — spec for NEO-RECIPE-02, the recipe defaults case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// recipe class, the misresolved default, or the unpainted probe on failure.
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

const STEM = 'neo-recipe__card';

// Extraction compiled the card recipe into five closed classes under the
// recipes layer. Bare and partial calls resolve through the table defaults,
// and each probe paints the defaulted axis it was given.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes('@layer recipes'), 'sheet carries the recipes layer');

  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  const table = data.runtimeData.recipes[STEM];
  assert.ok(table, `runtime data carries the ${STEM} table`);
  assert.deepEqual(
    table.defaultVariants,
    { size: 1, tone: 1 },
    'table carries the authored default indices',
  );
  assert.deepEqual(table.variantMap, { size: ['sm', 'lg'], tone: ['accent', 'muted'] }, 'table ships per-axis value names');
  const recipeClasses = [
    `${STEM}__base`,
    `${STEM}_s_sm`,
    `${STEM}_s_lg`,
    `${STEM}_t_accent`,
    `${STEM}_t_muted`,
  ];
  for (const cls of recipeClasses) {
    assert.ok(styles.includes(`.${cls}`), `sheet carries .${cls}`);
  }
  const recipeCount = styles.match(/\.neo-recipe__card/g)?.length ?? 0;
  assert.equal(recipeCount, 5, `sheet carries exactly the recipe classes, got ${recipeCount}`);

  assert.equal(table.combinations, undefined, 'table ships no pre-composed map');
  assert.equal(table.qualifiedName, undefined, 'table omits the stem (registry key carries it)');
  assert.equal(table.variantKeys, undefined, 'table omits the axis order');
  assert.deepEqual(Object.keys(table.variantMap), ['size', 'tone'], 'variant map keys order the axes');
  registerRecipeData(data.systemName, data.runtimeData.recipes, data.runtimeData.responsiveBreakpoints);
  const card = recipe({ className: 'card' });
  assert.equal(
    card(),
    `${STEM}__base ${STEM}_s_lg ${STEM}_t_muted`,
    'bare call fills every axis from defaults',
  );
  assert.equal(
    card({ tone: 'accent' }),
    `${STEM}__base ${STEM}_s_lg ${STEM}_t_accent`,
    'partial call defaults the omitted size axis',
  );

  const defaulted = page.locator('#defaulted');
  await defaulted.waitFor();
  assert.equal(
    await defaulted.evaluate((el) => getComputedStyle(el).height),
    '32px',
    'bare call paints the default lg height',
  );
  assert.equal(
    await defaulted.evaluate((el) => getComputedStyle(el).color),
    'rgb(255, 255, 255)',
    'bare call paints the default muted color',
  );

  const partial = page.locator('#partial');
  await partial.waitFor();
  assert.equal(
    await partial.evaluate((el) => getComputedStyle(el).height),
    '32px',
    'partial call paints the defaulted lg height',
  );
  assert.equal(
    await partial.evaluate((el) => getComputedStyle(el).color),
    'rgb(124, 58, 237)',
    'partial call paints the explicit accent color',
  );

  const explicit = page.locator('#explicit');
  await explicit.waitFor();
  assert.equal(
    await explicit.evaluate((el) => getComputedStyle(el).height),
    '8px',
    'explicit call paints the sm height, not the default',
  );
}
