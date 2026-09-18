// identity.spec.ts — spec for NEO-RECIPE-06, the recipe-identity case.
// Takes { page, case } from the runner with the world freshly synced and
// the page already navigated to it. Emits nothing on success; throws naming
// the unprefixed class, the misresolved selection, the unpainted probe, or
// the duplicate world that synced quietly.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import type { NativeRuntimeArtifact } from '@reference-ui/rust/contracts';
import { recipe, registerRecipeData } from '@reference-ui/neo/runtime';
import { sync } from '../../../../../src/sync/index.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

interface RuntimeDataModule {
  systemName: string;
  runtimeData: NativeRuntimeArtifact;
}

const STEM = 'neo-recipe__badge';

const EXPECTED_CLASSES = [`${STEM}__base`, `${STEM}_s_sm`, `${STEM}_s_lg`];

function dupConfigFile(): string {
  return [
    'import { defineConfig } from \'@reference-ui/neo\'',
    '',
    'export default defineConfig({',
    '  name: \'dup-world\',',
    '  include: [\'src/**/*.{js,ts,tsx}\'],',
    '})',
    '',
  ].join('\n');
}

function dupAppFile(): string {
  return [
    'import { recipe } from \'@reference-ui/react\'',
    '',
    'export const b1 = recipe({ className: \'dupBadge\', base: { display: \'flex\' } })',
    'export const b2 = recipe({ className: \'dupBadge\', base: { display: \'block\' } })',
    '',
  ].join('\n');
}

// Every recipe class is prefixed `${system}__${className}` in the sheet,
// the runtime combination, and the DOM, and each selection paints. A
// second world defining one className twice fails sync naming it.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes('@layer recipes'), 'sheet carries the recipes layer');
  for (const cls of EXPECTED_CLASSES) {
    assert.ok(styles.includes(`.${cls}`), `sheet carries .${cls}`);
  }
  const recipeCount = styles.match(/\.neo-recipe__/g)?.length ?? 0;
  assert.equal(recipeCount, 3, `sheet carries exactly the recipe classes, got ${recipeCount}`);

  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  registerRecipeData(data.systemName, data.runtimeData.recipes);
  const badge = recipe({ className: 'badge', defaultVariants: { size: 'sm' } });
  assert.equal(
    badge({ size: 'lg' }),
    `${STEM}__base ${STEM}_s_lg`,
    'lg resolves through the prefixed combination',
  );
  assert.equal(
    badge(),
    `${STEM}__base ${STEM}_s_sm`,
    'defaults resolve through the prefixed combination',
  );

  for (const [id, size] of [['sm', '12px'], ['lg', '20px'], ['defaults', '12px']] as const) {
    const probe = page.locator(`#${id}`);
    await probe.waitFor();
    const className = await probe.evaluate((el) => (el as HTMLElement).className);
    assert.ok(
      className.startsWith(`${STEM}__base`),
      `#${id} class carries the system__className prefix, got ${className}`,
    );
    assert.equal(
      await probe.evaluate((el) => getComputedStyle(el).fontSize),
      size,
      `#${id} paints its size`,
    );
    assert.equal(
      await probe.evaluate((el) => getComputedStyle(el).color),
      'rgb(17, 17, 17)',
      `#${id} paints the base ink`,
    );
  }

  const dupDir = fs.mkdtempSync(path.join(tmpdir(), 'neo-recipe06-'));
  try {
    fs.mkdirSync(path.join(dupDir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(dupDir, 'ui.config.ts'), dupConfigFile());
    fs.writeFileSync(path.join(dupDir, 'src', 'app.ts'), dupAppFile());
    await assert.rejects(
      sync(dupDir),
      /Duplicate recipe className 'dupBadge' within system 'dup-world'/,
      'duplicate className fails sync naming the duplicate',
    );
    assert.ok(
      !fs.existsSync(path.join(dupDir, '.reference-ui')),
      'failed sync leaves no half-written folder behind',
    );
  } finally {
    fs.rmSync(dupDir, { recursive: true, force: true });
  }
}
