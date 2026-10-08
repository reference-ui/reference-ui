// continuity.spec.ts — spec for NEO-CSS-16, the continuity case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// missing formula, the mispainted probe, the backed miss, or the missing
// or doubled browser diagnostic on failure.
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

interface DiagnosticWindow {
  __continuityDiagnostics: string[];
}

const SYSTEM = 'neo-css16';
const MISS_VALUE = '999r';

// Two arbitrary steps, two root calc formulas: unlisted magnitudes on a
// min/max prop compute like any other rhythm, and each probe paints its
// pixels at the known 0.25rem root. Harvest mints the pooled root length
// onto the dynamic site as a floor rule; the unscanned step has no rule,
// paints nothing, and warns once naming prop, value, and call site.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes('--spacing-root: 0.25rem'), 'sheet carries the rhythm root');
  assert.ok(
    styles.includes('max-width: calc(140 * var(--spacing-root));'),
    'sheet carries the 140r formula',
  );
  assert.ok(
    styles.includes('max-width: calc(137.5 * var(--spacing-root));'),
    'sheet carries the 137.5r formula',
  );
  assert.ok(!styles.includes('999r'), 'no rule leaks in for the unscanned step');
  assert.ok(
    styles.includes('max-width: 0.25rem;'),
    'sheet carries the harvested floor for the dynamic site',
  );
  const utilityCount = styles.match(new RegExp(`\\.${SYSTEM}__`, 'g'))?.length ?? 0;
  assert.equal(utilityCount, 3, `sheet carries the two formulas plus the floor, got ${utilityCount}`);

  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  registerRuntimeData(data.systemName, data.runtimeData);
  const big = css({ maxWidth: '140r' });
  const fractional = css({ maxWidth: '137.5r' });
  assert.ok(big.length > 0, '140r resolves to a class');
  assert.ok(fractional.length > 0, '137.5r resolves to a class');

  const bigProbe = page.locator('#big');
  await bigProbe.waitFor();
  assert.equal(await bigProbe.evaluate((el) => (el as HTMLElement).className), big, 'big probe carries the class');
  assert.equal(
    await bigProbe.evaluate((el) => getComputedStyle(el).maxWidth),
    '560px',
    '140r paints 560px',
  );

  const fractionalProbe = page.locator('#fractional');
  await fractionalProbe.waitFor();
  assert.equal(
    await fractionalProbe.evaluate((el) => (el as HTMLElement).className),
    fractional,
    'fractional probe carries the class',
  );
  assert.equal(
    await fractionalProbe.evaluate((el) => getComputedStyle(el).maxWidth),
    '550px',
    '137.5r paints 550px',
  );

  const miss = page.locator('#miss');
  await miss.waitFor();
  const missCls = await miss.evaluate((el) => el.getAttribute('class'));
  assert.equal(missCls, `${SYSTEM}__max-w_999r`, `miss carries its miss class, got ${JSON.stringify(missCls)}`);
  assert.equal(
    await miss.evaluate((el) => getComputedStyle(el).maxWidth),
    'none',
    'the miss paints nothing',
  );
  const pageDiags = await miss.evaluate(
    (el) => (el.ownerDocument.defaultView as unknown as DiagnosticWindow).__continuityDiagnostics,
  );
  assert.equal(pageDiags.length, 1, `page reports exactly one diagnostic, got ${pageDiags.length}`);
  assert.ok(pageDiags[0]?.includes('maxWidth'), `diagnostic names the prop, got ${pageDiags[0]}`);
  assert.ok(pageDiags[0]?.includes(MISS_VALUE), `diagnostic names the value, got ${pageDiags[0]}`);
  assert.ok(pageDiags[0]?.includes('app.js'), `diagnostic names the call site, got ${pageDiags[0]}`);
}
