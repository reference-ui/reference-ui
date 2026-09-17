// casing.spec.ts — spec for NEO-CSS-11, the custom-property-casing case.
// Takes { page, case } from the runner with the world freshly synced and the
// page already navigated to it. Emits nothing on success; throws naming the
// lowercased twin, the unread variable, or the unpainted probe on failure.
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

// One cased variable, one reader. The sheet keeps the exact casing with no
// lowercased twin, the holder answers under the exact name, and the nested
// probe paints through the inherited var.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  const utilityCount = styles.match(/\.neo-css11__/g)?.length ?? 0;
  assert.equal(utilityCount, 2, `sheet carries two utilities, got ${utilityCount}`);
  assert.ok(styles.includes('--testVariable0: hotpink;'), 'sheet carries the cased declaration');
  assert.ok(styles.includes('color: var(--testVariable0);'), 'sheet carries the cased reader');
  assert.ok(!styles.includes('--testvariable0'), 'sheet carries no lowercased twin');

  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  registerRuntimeData(data.systemName, data.runtimeData);
  const holder = css({ '--testVariable0': 'hotpink' });
  const ink = css({ color: 'var(--testVariable0)' });
  assert.ok(holder.length > 0, 'cased prop resolves to a class');
  assert.ok(ink.length > 0, 'var reader resolves to a class');

  const holderProbe = page.locator('#holder');
  await holderProbe.waitFor();
  assert.equal(
    await holderProbe.evaluate((el) => (el as HTMLElement).className),
    holder,
    'holder carries the resolved class',
  );
  assert.equal(
    await holderProbe.evaluate((el) => getComputedStyle(el).getPropertyValue('--testVariable0').trim()),
    'hotpink',
    'holder answers under the exact cased name',
  );

  const inkProbe = page.locator('#ink');
  await inkProbe.waitFor();
  assert.equal(
    await inkProbe.evaluate((el) => (el as HTMLElement).className),
    ink,
    'probe carries the resolved class',
  );
  assert.equal(
    await inkProbe.evaluate((el) => getComputedStyle(el).color),
    'rgb(255, 105, 180)',
    'nested probe paints through the cased var',
  );
}
