// override.spec.ts — spec for NEO-RECIPE-10, the recipe override case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// mislayered rule, the misresolved class, or the losing probe on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import type { NativeRuntimeArtifact } from '@reference-ui/rust/contracts';
import { css, recipe, registerRecipeData, registerRuntimeData } from '@reference-ui/neo/runtime';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

interface RuntimeDataModule {
  systemName: string;
  runtimeData: NativeRuntimeArtifact;
}

const STEM = 'neo-recipe__flag';

// Extraction compiled the flag recipe into closed classes in the recipes
// layer and the paper utility into the later utilities layer, so the mixed
// node paints the utility color while the recipe-only node keeps brand.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  const recipesIdx = styles.indexOf('@layer recipes {');
  const utilitiesIdx = styles.indexOf('@layer utilities {');
  assert.ok(recipesIdx > -1, 'sheet carries the recipes layer block');
  assert.ok(utilitiesIdx > -1, 'sheet carries the utilities layer block');
  assert.ok(recipesIdx < utilitiesIdx, 'recipes layer prints before utilities layer');

  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  const table = data.runtimeData.recipes[STEM];
  assert.ok(table, `runtime data carries the ${STEM} table`);
  assert.deepEqual(table.variantMap, { tone: ['accent', 'muted'] }, 'table ships the value names');
  const accent = `${STEM}_t_accent`;

  registerRecipeData(data.systemName, data.runtimeData.recipes, data.runtimeData.responsiveBreakpoints);
  registerRuntimeData(data.systemName, data.runtimeData);
  const flag = recipe({ className: 'flag' });
  const recipeClasses = flag({ tone: 'accent' });
  assert.ok(recipeClasses.includes(accent), 'accent selection carries the accent class');
  const util = css({ color: 'paper' });
  assert.ok(util.length > 0, 'paper utility resolves to a class');
  const accentIdx = styles.indexOf(`.${accent} `);
  const utilIdx = styles.indexOf(`.${util} `);
  assert.ok(accentIdx > -1, 'sheet carries the accent rule');
  assert.ok(utilIdx > -1, 'sheet carries the paper utility rule');
  assert.ok(recipesIdx < accentIdx && accentIdx < utilitiesIdx, 'accent rule sits in recipes layer');
  assert.ok(utilIdx > utilitiesIdx, 'paper utility rule sits in utilities layer');

  async function color(id: string): Promise<string> {
    const node = page.locator(`#${id}`);
    await node.waitFor();
    return node.evaluate((el) => getComputedStyle(el).color);
  }

  assert.equal(await color('mixed'), 'rgb(255, 255, 255)', 'mixed node paints the utility paper');
  assert.equal(await color('recipeonly'), 'rgb(124, 58, 237)', 'recipe-only node paints brand');
}
