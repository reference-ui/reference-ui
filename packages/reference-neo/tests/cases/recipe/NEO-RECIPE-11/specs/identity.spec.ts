// identity.spec.ts — spec for NEO-RECIPE-11, the binding-inferred recipe case.
// Takes { page, case } from the runner with the world freshly synced and the
// page already navigated to it. Emits nothing on success; throws naming the
// missing inferred table, the unresolvable tone, or the unpainted probe.
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

const STEM = 'neo-recipe__chip';

// Sync admitted the className-less chipRecipe as neo-recipe__chip with its
// base, tones, and default intact. The inferred table resolves through the
// explicit-identity runtime path indistinguishably, and both probes paint.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes('@layer recipes'), 'sheet carries the recipes layer');
  assert.ok(!styles.includes('@layer utilities {'), 'sheet emits no utilities layer block');
  assert.ok(styles.includes(`.${STEM}__base`), 'sheet prints the inferred base rule');
  assert.ok(styles.includes(`.${STEM}_t_loud`), 'sheet prints the inferred loud rule');
  assert.ok(styles.includes(`.${STEM}_t_quiet`), 'sheet prints the inferred quiet rule');

  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  assert.ok(!('stylePlans' in data.runtimeData), 'runtime data carries no per-atom row');
  const table = data.runtimeData.recipes[STEM];
  assert.ok(table, `runtime data carries the inferred ${STEM} table`);
  assert.equal(table.qualifiedName, undefined, 'table omits the stem (registry key carries it)');
  assert.deepEqual(table.variantMap, { tone: ['loud', 'quiet'] }, 'table ships the value names');
  assert.deepEqual(table.defaultVariants, { tone: 1 }, 'table carries the default index');

  assert.equal(table.combinations, undefined, 'table ships no pre-composed map');
  registerRecipeData(data.systemName, data.runtimeData.recipes, data.runtimeData.responsiveBreakpoints);
  const chip = recipe({ className: 'chip' });
  const loud = `${STEM}__base ${STEM}_t_loud`;
  const quiet = `${STEM}__base ${STEM}_t_quiet`;
  assert.equal(chip({ tone: 'loud' }), loud, 'loud resolves');
  assert.equal(chip({ tone: 'quiet' }), quiet, 'quiet resolves');
  assert.equal(chip({}), quiet, 'default selects quiet');
  assert.notEqual(chip({ tone: 'loud' }), chip({ tone: 'quiet' }), 'tones resolve distinctly');

  async function style(id: string): Promise<{ background: string; color: string }> {
    const node = page.locator(`#${id}`);
    await node.waitFor();
    return node.evaluate((el: Element) => {
      const computed = getComputedStyle(el);
      return { background: computed.backgroundColor, color: computed.color };
    });
  }

  assert.deepEqual(
    await style('loud'),
    { background: 'rgb(124, 58, 237)', color: 'rgb(17, 17, 17)' },
    'loud paints brand over the ink base',
  );
  assert.deepEqual(
    await style('quiet'),
    { background: 'rgb(255, 255, 255)', color: 'rgb(17, 17, 17)' },
    'quiet paints paper over the ink base',
  );
}
