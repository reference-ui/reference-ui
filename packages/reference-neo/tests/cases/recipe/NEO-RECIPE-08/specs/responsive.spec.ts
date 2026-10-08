// responsive.spec.ts — spec for NEO-RECIPE-08, the recipe responsive case.
// Takes { page, case } from the runner with the world freshly synced and the
// page already navigated to it. Emits nothing on success; throws naming the
// missing breakpoint class, the misresolved selection, or the unflipped probe
// on failure.
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

const STEM = 'neo-recipe__swatch';
const MD_QUERY = '@container (min-width: 768px)';

// Extraction compiled the swatch recipe into closed classes plus one
// per-breakpoint class per value inside container queries. The responsive
// call emits the base combination plus the md class, and the live container
// flips the painted variant as it crosses 768px.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes('@layer recipes'), 'sheet carries the recipes layer');
  assert.ok(styles.includes(MD_QUERY), 'sheet carries the md container query');
  assert.ok(!styles.includes('@media screen'), 'sheet keeps container queries, never media');

  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  const table = data.runtimeData.recipes[STEM];
  assert.ok(table, `runtime data carries the ${STEM} table`);
  assert.equal(table.combinations, undefined, 'table ships no pre-composed map');
  assert.equal(table.responsiveVariantMap, undefined, 'table ships no per-breakpoint map');
  assert.equal(table.responsiveBreakpoints, undefined, 'table ships no per-table breakpoint list');
  assert.deepEqual(
    data.runtimeData.responsiveBreakpoints,
    ['sm', 'md', 'lg', 'xl', '2xl'],
    'artifact hoists the width breakpoint list',
  );
  assert.deepEqual(table.variantMap, { variant: ['solid', 'outline'] }, 'table ships the value names');
  const mdOutline = `md:${STEM}_v_outline`;
  const baseCombination = `${STEM}__base ${STEM}_v_solid`;

  for (const cls of baseCombination.split(' ')) {
    assert.ok(styles.includes(`.${cls}`), `sheet carries .${cls}`);
  }
  const mdSelector = `.${mdOutline.replace(':', '\\:')}`;
  assert.ok(styles.includes(mdSelector), `sheet carries ${mdSelector}`);
  const solidIdx = styles.indexOf(`.${STEM}_v_solid `);
  assert.ok(
    solidIdx > -1 && solidIdx < styles.indexOf(MD_QUERY),
    'plain solid rule prints before the md query',
  );
  const mdRule = styles.slice(styles.indexOf(mdSelector), styles.indexOf('}', styles.indexOf(mdSelector)));
  assert.ok(mdRule.includes('var(--colors-paper)'), 'md outline rule paints the paper background');

  registerRecipeData(data.systemName, data.runtimeData.recipes, data.runtimeData.responsiveBreakpoints);
  const swatch = recipe({ className: 'swatch' });
  assert.equal(
    swatch({ variant: { base: 'solid', md: 'outline' } }),
    `${baseCombination} ${mdOutline}`,
    'responsive call emits the base combination plus the md class',
  );

  async function paint(id: string): Promise<{ background: string; color: string }> {
    const node = page.locator(`#${id}`);
    await node.waitFor();
    const background = await node.evaluate((el) => getComputedStyle(el).backgroundColor);
    const color = await node.evaluate((el) => getComputedStyle(el).color);
    return { background, color };
  }

  assert.deepEqual(
    await paint('narrow-probe'),
    { background: 'rgb(124, 58, 237)', color: 'rgb(255, 255, 255)' },
    'narrow container paints solid',
  );
  assert.deepEqual(
    await paint('wide-probe'),
    { background: 'rgb(255, 255, 255)', color: 'rgb(124, 58, 237)' },
    'wide container paints outline',
  );

  const live = page.locator('#live');
  await live.waitFor();
  assert.deepEqual(
    await paint('live-probe'),
    { background: 'rgb(124, 58, 237)', color: 'rgb(255, 255, 255)' },
    'live container starts solid',
  );
  await live.evaluate((el) => {
    el.style.width = '800px';
  });
  assert.deepEqual(
    await paint('live-probe'),
    { background: 'rgb(255, 255, 255)', color: 'rgb(124, 58, 237)' },
    'widening the container paints outline',
  );
  await live.evaluate((el) => {
    el.style.width = '400px';
  });
  assert.deepEqual(
    await paint('live-probe'),
    { background: 'rgb(124, 58, 237)', color: 'rgb(255, 255, 255)' },
    'narrowing the container restores solid',
  );
}
