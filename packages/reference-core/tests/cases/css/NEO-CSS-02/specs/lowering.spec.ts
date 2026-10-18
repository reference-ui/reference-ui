// lowering.spec.ts — spec for NEO-CSS-02, the responsive lowering parity case.
// Takes { page, case } from the runner with the world freshly synced and the
// page already navigated to it. Emits nothing on success; throws naming the
// divergent class, the missing container rule, or the mispainted probe.
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

const EXPECTED_CLASS = 'neo-css2__[@container_(min-width:_320px)]:c_paper';

// Build time extracted the container-query call and ignored the r sugar, so
// the sheet carries exactly one utility. At runtime both forms resolve to
// that same class, and it paints only inside matching containers.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes('@container (min-width: 320px)'), 'sheet carries the container rule');
  assert.ok(styles.includes('c_paper'), 'sheet carries the paper utility');
  const utilityCount = styles.match(/\.neo-css2__/g)?.length ?? 0;
  assert.equal(utilityCount, 1, `sheet carries one utility, got ${utilityCount}`);

  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  registerRuntimeData(data.systemName, data.runtimeData);
  const lowered = css({ r: { 320: { color: 'paper' } } });
  const direct = css({ '@container (min-width: 320px)': { color: 'paper' } });
  assert.equal(lowered, EXPECTED_CLASS, `r sugar lowers to the compiled class, got ${lowered}`);
  assert.equal(direct, EXPECTED_CLASS, `direct form matches the compiled class, got ${direct}`);

  const wide = page.locator('#wide-probe');
  await wide.waitFor();
  const wideColor = await wide.evaluate((el) => getComputedStyle(el).color);
  assert.equal(wideColor, 'rgb(255, 255, 255)', `wide container paints paper, got ${wideColor}`);

  const narrow = page.locator('#narrow-probe');
  await narrow.waitFor();
  const narrowColor = await narrow.evaluate((el) => getComputedStyle(el).color);
  assert.equal(narrowColor, 'rgb(17, 17, 17)', `narrow container keeps ink, got ${narrowColor}`);
}
