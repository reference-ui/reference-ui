// rhythm.spec.ts — spec for NEO-CSS-12, the rhythm-value case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// missing formula, the per-key var leak, or the mispainted probe.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import type { NativeRuntimeArtifact } from '@reference-ui/rust/contracts';
import { css, registerRuntimeData } from '@reference-ui/neo/runtime';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

interface RuntimeDataModule {
  systemName: string;
  runtimeData: NativeRuntimeArtifact;
}

// Three steps, three calc formulas over the one root. Integer, decimal, and
// fraction all lower to root-relative calc — never to per-key spacing vars —
// and each probe paints its pixels at the known 0.25rem root.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes('--spacing-root: 0.25rem'), 'sheet carries the rhythm root');
  const utilityCount = styles.match(/\.neo-css12__/g)?.length ?? 0;
  assert.equal(utilityCount, 3, `sheet carries three utilities, got ${utilityCount}`);
  assert.ok(styles.includes('margin-top: calc(4 * var(--spacing-root));'), 'sheet carries the integer formula');
  assert.ok(styles.includes('padding-top: calc(3.5 * var(--spacing-root));'), 'sheet carries the decimal formula');
  assert.ok(
    styles.includes('margin-bottom: calc(var(--spacing-root) / 2);'),
    'sheet carries the fraction formula',
  );
  assert.ok(!styles.includes('--spacing-4r'), 'sheet mints no per-key spacing var');

  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  registerRuntimeData(data.systemName, data.runtimeData);
  const int = css({ marginTop: '4r' });
  const decimal = css({ paddingTop: '3.5r' });
  const fraction = css({ marginBottom: '1/2r' });
  assert.ok(int.length > 0, 'integer rhythm resolves to a class');
  assert.ok(decimal.length > 0, 'decimal rhythm resolves to a class');
  assert.ok(fraction.length > 0, 'fraction rhythm resolves to a class');

  const intProbe = page.locator('#int');
  await intProbe.waitFor();
  assert.equal(await intProbe.evaluate((el) => (el as HTMLElement).className), int, 'int probe carries the class');
  assert.equal(await intProbe.evaluate((el) => getComputedStyle(el).marginTop), '16px', '4r paints 16px');

  const decimalProbe = page.locator('#decimal');
  await decimalProbe.waitFor();
  assert.equal(
    await decimalProbe.evaluate((el) => (el as HTMLElement).className),
    decimal,
    'decimal probe carries the class',
  );
  assert.equal(
    await decimalProbe.evaluate((el) => getComputedStyle(el).paddingTop),
    '14px',
    '3.5r paints 14px',
  );

  const fractionProbe = page.locator('#fraction');
  await fractionProbe.waitFor();
  assert.equal(
    await fractionProbe.evaluate((el) => (el as HTMLElement).className),
    fraction,
    'fraction probe carries the class',
  );
  assert.equal(
    await fractionProbe.evaluate((el) => getComputedStyle(el).marginBottom),
    '2px',
    '1/2r paints 2px',
  );
}
