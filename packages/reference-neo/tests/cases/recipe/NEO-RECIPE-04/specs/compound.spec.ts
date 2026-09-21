// compound.spec.ts — spec for NEO-RECIPE-04, the recipe compound case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// misordered rule, the misfired compound, or the unpainted probe on failure.
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

const STEM = 'neo-recipe__banner';

// Extraction compiled the banner recipe into closed classes with the compound
// rule after every simple rule, so source order lets the compound win. The
// predicate matrix paints only when every predicate holds, and the compound's
// hover and dark arms fire on the compound class alone.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes('@layer recipes'), 'sheet carries the recipes layer');

  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  const table = data.runtimeData.recipes[STEM];
  assert.ok(table, `runtime data carries the ${STEM} table`);
  assert.equal(table.compoundVariants.length, 1, 'table carries the one compound');
  const compound = table.compoundVariants[0]?.className;
  assert.ok(compound, 'compound carries its closed class');
  assert.deepEqual(table.variantMap, { tone: ['accent', 'muted'], size: ['sm', 'lg'] }, 'table ships per-axis value names');
  const simpleClasses = [
    `${STEM}__base`,
    `${STEM}_t_accent`,
    `${STEM}_t_muted`,
    `${STEM}_s_sm`,
    `${STEM}_s_lg`,
  ];
  for (const cls of [...simpleClasses, compound]) {
    assert.ok(styles.includes(`.${cls}`), `sheet carries .${cls}`);
  }
  const compoundIdx = styles.indexOf(`.${compound} `);
  assert.ok(compoundIdx > -1, 'sheet prints the compound base rule');
  for (const cls of simpleClasses) {
    assert.ok(
      styles.indexOf(`.${cls} `) < compoundIdx,
      `compound rule prints after .${cls}`,
    );
  }
  assert.ok(
    styles.includes(':is(:hover, [data-hover])'),
    'sheet wraps the compound hover arm',
  );
  assert.ok(styles.includes('[data-color-mode=dark]'), 'sheet wraps the compound dark arm');

  registerRecipeData(data.systemName, data.runtimeData.recipes, data.runtimeData.responsiveBreakpoints);
  const banner = recipe({ className: 'banner' });
  assert.ok(
    banner({ tone: 'accent', size: 'lg' }).includes(compound),
    'full selection carries the compound class',
  );
  assert.ok(
    !banner({ tone: 'accent', size: 'sm' }).includes(compound),
    'accent alone omits the compound class',
  );
  assert.ok(
    !banner({ tone: 'muted', size: 'lg' }).includes(compound),
    'lg alone omits the compound class',
  );

  const combo = page.locator('#combo');
  await combo.waitFor();
  assert.equal(
    await combo.evaluate((el) => getComputedStyle(el).backgroundColor),
    'rgb(17, 17, 17)',
    'full selection paints the compound background',
  );

  const accentonly = page.locator('#accentonly');
  await accentonly.waitFor();
  assert.equal(
    await accentonly.evaluate((el) => getComputedStyle(el).backgroundColor),
    'rgba(0, 0, 0, 0)',
    'accent alone leaves the compound background off',
  );

  const lgonly = page.locator('#lgonly');
  await lgonly.waitFor();
  assert.equal(
    await lgonly.evaluate((el) => getComputedStyle(el).backgroundColor),
    'rgba(0, 0, 0, 0)',
    'lg alone leaves the compound background off',
  );

  const hovertwin = page.locator('#hovertwin');
  await hovertwin.waitFor();
  assert.equal(
    await hovertwin.evaluate((el) => getComputedStyle(el).backgroundColor),
    'rgb(124, 58, 237)',
    'compound selection paints the hover arm via data-hover',
  );

  const hoverPage = page as unknown as HoverPage;
  await hoverPage.hover('#combo');
  assert.equal(
    await combo.evaluate((el) => getComputedStyle(el).backgroundColor),
    'rgb(124, 58, 237)',
    'real hover paints the compound hover arm',
  );
  await hoverPage.hover('#accentonly');
  assert.equal(
    await combo.evaluate((el) => getComputedStyle(el).backgroundColor),
    'rgb(17, 17, 17)',
    'leaving restores the compound background',
  );
  assert.equal(
    await accentonly.evaluate((el) => getComputedStyle(el).backgroundColor),
    'rgba(0, 0, 0, 0)',
    'hover on a partial selection paints no compound arm',
  );

  const comboindark = page.locator('#comboindark');
  await comboindark.waitFor();
  assert.equal(
    await comboindark.evaluate((el) => getComputedStyle(el).color),
    'rgb(17, 17, 17)',
    'compound selection paints the dark arm under data-color-mode',
  );

  const partialindark = page.locator('#partialindark');
  await partialindark.waitFor();
  assert.equal(
    await partialindark.evaluate((el) => getComputedStyle(el).color),
    'rgb(124, 58, 237)',
    'partial selection keeps its tone color in the dark',
  );
}
