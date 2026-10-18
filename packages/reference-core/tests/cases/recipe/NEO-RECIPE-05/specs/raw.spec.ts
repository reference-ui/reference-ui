// raw.spec.ts — spec for NEO-RECIPE-05, the recipe raw case. Takes { page,
// case } from the runner with the world freshly synced and the page already
// navigated to it. Emits nothing on success; throws naming the mismerged raw
// object, the missing twin utility, or the diverged paint on failure.
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

const STEM = 'neo-recipe__panel';

// The authored panel definition, mirrored from the world: raw() merges from
// this definition while class resolution runs through the compiled table, so
// the spec holds both and proves they agree in the browser.
const CONFIG = {
  className: 'panel',
  base: { color: 'ink' },
  variants: {
    tone: { accent: { color: 'brand' }, muted: { color: 'paper' } },
    size: { sm: { p: 'sm' }, lg: { p: 'lg' } },
  },
  defaultVariants: { tone: 'muted', size: 'sm' },
  compoundVariants: [{ tone: 'accent', size: 'lg', css: { backgroundColor: 'ink' } }],
};

// Extraction compiled the panel recipe into six closed classes plus the five
// twin utilities. raw() merges base, variant, and matching compound leaves,
// and each raw-fed node paints computed styles equal to its class-fed twin.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes('@layer recipes'), 'sheet carries the recipes layer');
  assert.ok(styles.includes('@layer utilities'), 'sheet carries the utilities layer');

  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  const table = data.runtimeData.recipes[STEM];
  assert.ok(table, `runtime data carries the ${STEM} table`);
  const recipeCount = styles.match(/\.neo-recipe__panel/g)?.length ?? 0;
  assert.equal(recipeCount, 6, `sheet carries exactly the recipe classes, got ${recipeCount}`);
  const allCount = styles.match(/\.neo-recipe__/g)?.length ?? 0;
  assert.equal(allCount, 11, `sheet carries recipe classes plus five twin utilities, got ${allCount}`);

  registerRecipeData(data.systemName, data.runtimeData.recipes);
  const panel = recipe(CONFIG);
  assert.deepEqual(
    panel.raw({ tone: 'accent', size: 'lg' }),
    { color: 'brand', p: 'lg', backgroundColor: 'ink' },
    'raw merges base, variants, and the matching compound',
  );
  assert.deepEqual(
    panel.raw(),
    { color: 'paper', p: 'sm' },
    'raw fills gaps from defaults and skips the unmatched compound',
  );

  async function paint(id: string): Promise<{ color: string; padding: string; background: string }> {
    const node = page.locator(`#${id}`);
    await node.waitFor();
    const color = await node.evaluate((el) => getComputedStyle(el).color);
    const padding = await node.evaluate((el) => getComputedStyle(el).paddingTop);
    const background = await node.evaluate((el) => getComputedStyle(el).backgroundColor);
    return { color, padding, background };
  }

  assert.deepEqual(await paint('rawfed'), await paint('classed'), 'raw-fed paints equal to class-fed');
  assert.deepEqual(
    await paint('rawfeddefault'),
    await paint('classeddefault'),
    'raw-fed defaults paint equal to class-fed defaults',
  );
  assert.deepEqual(
    await paint('classed'),
    { color: 'rgb(124, 58, 237)', padding: '32px', background: 'rgb(17, 17, 17)' },
    'class-fed accent+lg paints its resolved styles',
  );
}
