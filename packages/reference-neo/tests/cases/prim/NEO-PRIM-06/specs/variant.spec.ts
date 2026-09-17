// variant.spec.ts — spec for NEO-PRIM-06, the variant case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// stamp, the unpainted recipe, or the utility either metadata key minted.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

interface RuntimeDataModule {
  runtimeData: { stylePropNames: string[] };
}

// Stamp plus class plus paint, and silence everywhere else. The variant twin
// carries data-variant and the ref-div marker, so the global tag recipe
// paints it brand while the plain twin stays unpainted. Neither metadata
// key mints a utility or appears in the published style prop names.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  const utilityCount = styles.match(/\.neo-prim6__/g)?.length ?? 0;
  assert.equal(utilityCount, 0, `metadata keys mint no utilities, got ${utilityCount}`);
  const utilities = styles.slice(styles.indexOf('@layer utilities'));
  assert.ok(!utilities.includes('variant'), 'utilities layer names no variant');
  assert.ok(!utilities.includes('color-mode'), 'utilities layer names no color mode');
  assert.ok(!styles.includes('[data-color-mode=dark]'), 'no dark island without dark leaves');

  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  assert.equal(
    data.runtimeData.stylePropNames.includes('variant'),
    false,
    'stylePropNames excludes variant (ABI 4.3)',
  );
  assert.equal(
    data.runtimeData.stylePropNames.includes('colorMode'),
    false,
    'stylePropNames excludes colorMode (ABI 4.3)',
  );

  const accent = page.locator('#accent');
  await accent.waitFor();
  assert.equal(
    await accent.evaluate((el) => el.getAttribute('data-variant')),
    'accent',
    'variant stamps data-variant',
  );
  const accentClass = await accent.evaluate((el) => el.getAttribute('class'));
  assert.ok(accentClass?.includes('ref-div'), `recipe marker class lands, got ${accentClass}`);
  assert.equal(
    await accent.evaluate((el) => el.getAttribute('variant')),
    null,
    'variant never lands as a bare attribute',
  );
  const accentColor = await accent.evaluate((el) => getComputedStyle(el).color);
  assert.equal(accentColor, 'rgb(124, 58, 237)', `tag recipe paints the twin, got ${accentColor}`);

  const plain = page.locator('#plain');
  await plain.waitFor();
  assert.equal(
    await plain.evaluate((el) => el.getAttribute('data-variant')),
    null,
    'plain twin stamps no variant',
  );
  const plainColor = await plain.evaluate((el) => getComputedStyle(el).color);
  assert.notEqual(plainColor, 'rgb(124, 58, 237)', `plain twin stays unpainted, got ${plainColor}`);

  const dark = page.locator('#dark');
  await dark.waitFor();
  assert.equal(
    await dark.evaluate((el) => el.getAttribute('data-color-mode')),
    'dark',
    'colorMode stamps data-color-mode',
  );
  assert.equal(
    await dark.evaluate((el) => el.getAttribute('colorMode')),
    null,
    'colorMode never lands as a bare attribute',
  );
  assert.equal(
    await dark.evaluate((el) => el.getAttribute('data-layer')),
    'neo-prim6',
    'colorMode twin stamps the system layer',
  );
}
