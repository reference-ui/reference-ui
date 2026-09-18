// override.spec.ts — spec for NEO-LAYER-05, the recipe-before-utilities case.
// Takes { page, case } from the runner with the world freshly synced and the
// page already navigated to it. Emits nothing on success; throws naming the
// misordered layer, the misplaced rule, or the unpainted host on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The world defined one button recipe with an ink base and a size axis, and
// painted one host with the recipe plus a brand utility plus one bare recipe
// control. The sheet prints the recipes layer before the utilities layer with
// the recipe rules inside recipes and the brand rule inside utilities; the
// host paints brand while the control paints ink.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const recipesOpen = styles.indexOf('@layer recipes {');
  const utilitiesOpen = styles.indexOf('@layer utilities {');
  assert.ok(recipesOpen !== -1, 'sheet carries @layer recipes');
  assert.ok(utilitiesOpen !== -1, 'sheet carries @layer utilities');
  assert.ok(
    recipesOpen < utilitiesOpen,
    'recipe rules precede utilities in the sheet',
  );
  const recipes = styles.slice(recipesOpen, utilitiesOpen);
  const utilities = styles.slice(utilitiesOpen);
  assert.ok(
    recipes.includes('button__base') && recipes.includes('color: var(--colors-ink)'),
    'recipes layer carries the ink base',
  );
  assert.ok(
    recipes.includes('button_s_sm'),
    'recipes layer carries the size variant',
  );
  assert.ok(
    utilities.includes('color: var(--colors-brand)'),
    'utilities layer carries the brand override',
  );
  assert.ok(
    !utilities.includes('button__base'),
    'recipe base stays out of the utilities layer',
  );

  const host = page.locator('#host');
  await host.waitFor();
  assert.equal(
    await host.evaluate((el) => getComputedStyle(el).color),
    'rgb(124, 58, 237)',
    'host utility overrides the recipe base',
  );
  assert.equal(
    await host.evaluate((el) => getComputedStyle(el).paddingTop),
    '8px',
    'host keeps the recipe size variant padding',
  );

  const recipeonly = page.locator('#recipeonly');
  await recipeonly.waitFor();
  assert.equal(
    await recipeonly.evaluate((el) => getComputedStyle(el).color),
    'rgb(17, 17, 17)',
    'bare recipe control paints the ink base',
  );
}
