// boolean.spec.ts — spec for NEO-RECIPE-03, the recipe boolean case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// boolean arm, the undistinct selection, or the unpainted probe on failure.
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

// The display:none probes never become visible, so the narrow SpecPage shape
// cannot wait for them; this interface names the attached-state wait the real
// Playwright locator carries.
interface AttachedLocator {
  waitFor(opts: { state: string }): Promise<void>;
  evaluate<T>(fn: (el: HTMLElement) => T): Promise<T>;
}

const STEM = 'neo-recipe__toggle';

// Extraction compiled the toggle recipe into three closed classes: base plus
// one arm per boolean value. Boolean selections stringify onto distinct arms,
// and each probe paints its own computed display.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes('@layer recipes'), 'sheet carries the recipes layer');

  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  const table = data.runtimeData.recipes[STEM];
  assert.ok(table, `runtime data carries the ${STEM} table`);
  const arms = table.variantMap['active'];
  assert.ok(arms?.['true'], 'table carries the true arm');
  assert.ok(arms?.['false'], 'table carries the false arm');
  assert.notEqual(arms['true'], arms['false'], 'boolean arms map to distinct classes');
  for (const cls of [table.base, arms['true'], arms['false']]) {
    assert.ok(styles.includes(`.${cls}`), `sheet carries .${cls}`);
  }
  const recipeCount = styles.match(/\.neo-recipe__toggle/g)?.length ?? 0;
  assert.equal(recipeCount, 3, `sheet carries exactly the recipe classes, got ${recipeCount}`);

  registerRecipeData(data.systemName, data.runtimeData.recipes);
  const toggle = recipe({ className: 'toggle' });
  assert.equal(toggle({ active: true }), table.combinations['true'], 'true resolves its arm');
  assert.equal(toggle({ active: false }), table.combinations['false'], 'false resolves its arm');
  assert.equal(toggle(), table.combinations['false'], 'bare call falls back to the false default');
  assert.notEqual(toggle({ active: true }), toggle({ active: false }), 'arms resolve distinctly');

  const on = page.locator('#on');
  await on.waitFor();
  assert.equal(
    await on.evaluate((el) => getComputedStyle(el).display),
    'block',
    'true paints block',
  );

  const off = page.locator('#off') as unknown as AttachedLocator;
  await off.waitFor({ state: 'attached' });
  assert.equal(
    await off.evaluate((el) => getComputedStyle(el).display),
    'none',
    'false paints none',
  );

  const defaulted = page.locator('#defaulted') as unknown as AttachedLocator;
  await defaulted.waitFor({ state: 'attached' });
  assert.equal(
    await defaulted.evaluate((el) => getComputedStyle(el).display),
    'none',
    'bare call paints the false default',
  );
}
