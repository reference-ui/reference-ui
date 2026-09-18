// hover.spec.ts — spec for NEO-RECIPE-09, the recipe hover case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// missing hover rule, the stray utility, or the unpainted probe on failure.
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

// The runner hands specs the real Playwright page, whose hover member the
// narrow SpecPage shape omits; this interface names just that member.
interface HoverPage {
  hover(selector: string): Promise<void>;
}

const STEM = 'neo-recipe__chip';

// Extraction compiled the chip recipe into closed classes with the hover arm
// hanging off the loud variant class, and emitted no utilities. Loud and
// quiet resolve to distinct classes, and the arm paints only on loud.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes('@layer recipes'), 'sheet carries the recipes layer');
  assert.ok(!styles.includes('@layer utilities {'), 'sheet emits no utilities layer block');

  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  assert.deepEqual(data.runtimeData.stylePlans, [], 'runtime data carries no style plans');
  const table = data.runtimeData.recipes[STEM];
  assert.ok(table, `runtime data carries the ${STEM} table`);
  const loud = table.variantMap['tone']?.['loud'];
  const quiet = table.variantMap['tone']?.['quiet'];
  assert.ok(loud, 'table carries the loud class');
  assert.ok(quiet, 'table carries the quiet class');
  assert.ok(
    styles.includes(`.${loud}:is(:hover, [data-hover])`),
    'hover arm hangs off the loud variant class',
  );
  assert.ok(
    !styles.includes(`.${quiet}:is(:hover, [data-hover])`),
    'quiet variant carries no hover arm',
  );

  registerRecipeData(data.systemName, data.runtimeData.recipes);
  const chip = recipe({ className: 'chip' });
  assert.equal(
    chip({ tone: 'loud' }),
    table.combinations['loud'],
    'loud resolves through its combination',
  );
  assert.equal(
    chip({ tone: 'quiet' }),
    table.combinations['quiet'],
    'quiet resolves through its combination',
  );
  assert.notEqual(chip({ tone: 'loud' }), chip({ tone: 'quiet' }), 'tones resolve distinctly');

  async function background(id: string): Promise<string> {
    const node = page.locator(`#${id}`);
    await node.waitFor();
    return node.evaluate((el) => getComputedStyle(el).backgroundColor);
  }

  assert.equal(await background('loud'), 'rgb(124, 58, 237)', 'loud paints brand');
  assert.equal(await background('quiet'), 'rgb(255, 255, 255)', 'quiet paints paper');
  assert.equal(await background('hovertwin'), 'rgb(17, 17, 17)', 'data-hover twin paints ink');

  const hoverPage = page as unknown as HoverPage;
  await hoverPage.hover('#loud');
  assert.equal(await background('loud'), 'rgb(17, 17, 17)', 'real hover paints the loud arm');
  await hoverPage.hover('#quiet');
  assert.equal(await background('loud'), 'rgb(124, 58, 237)', 'leaving restores loud brand');
  assert.equal(await background('quiet'), 'rgb(255, 255, 255)', 'hover paints no arm on quiet');
}
