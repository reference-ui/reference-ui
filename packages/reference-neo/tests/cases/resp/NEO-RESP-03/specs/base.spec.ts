// base.spec.ts — spec for NEO-RESP-03, the base-key case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// missing utility, the prefixed base class, or the mispainted probe.
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

const EXPECTED = 'neo-resp3__w_50px neo-resp3__md:w_60px';

// The per-prop object expands to the bare base utility plus the md
// container rule. Base carries no condition prefix in the class string,
// the sheet, or the cascade: narrow paints 50px, wide paints 60px.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes('@container (min-width: 768px)'), 'sheet carries the md container rule');
  assert.ok(styles.includes('.neo-resp3__w_50px {'), 'sheet carries the bare base utility');
  assert.ok(styles.includes('w_60px'), 'sheet carries the md width utility');
  assert.ok(!styles.includes('base:'), 'no base: prefix leaks into the sheet');
  const utilityCount = styles.match(/\.neo-resp3__/g)?.length ?? 0;
  assert.equal(utilityCount, 2, `sheet carries exactly the two utilities, got ${utilityCount}`);

  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  registerRuntimeData(data.systemName, data.runtimeData);
  const resolved = css({ width: { base: '50px', md: '60px' } });
  assert.equal(resolved, EXPECTED, `base resolves unprefixed, got ${resolved}`);

  for (const id of ['probe-narrow', 'probe-wide']) {
    const probe = page.locator(`#${id}`);
    await probe.waitFor();
    assert.equal(
      await probe.evaluate((el) => (el as HTMLElement).className),
      EXPECTED,
      `${id} carries both classes`,
    );
  }
  const narrow = page.locator('#probe-narrow');
  await narrow.waitFor();
  assert.equal(
    await narrow.evaluate((el) => getComputedStyle(el).width),
    '50px',
    'narrow container paints the base width',
  );
  const wide = page.locator('#probe-wide');
  await wide.waitFor();
  assert.equal(
    await wide.evaluate((el) => getComputedStyle(el).width),
    '60px',
    'wide container paints the md width',
  );
}
