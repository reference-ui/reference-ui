// resize.spec.ts — spec for NEO-RESP-01, the responsive array case.
// Takes { page, case } from the runner with the world freshly synced and the
// page already navigated to it. Emits nothing on success; throws naming the
// missing container rule, the unresolved array, or the mispainted probe.
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

async function computedWidth(page: SpecPage, selector: string): Promise<string> {
  const probe = page.locator(selector);
  await probe.waitFor();
  return probe.evaluate((el) => getComputedStyle(el).width);
}

// The array lowers to base plus the first breakpoint at build time, and the
// same array resolves the same two classes at runtime. The browser proof
// resizes one container element and reads computed width at each step.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes('@container (min-width: 640px)'), 'sheet carries the sm container rule');
  assert.ok(styles.includes('w_50px'), 'sheet carries the base width utility');
  assert.ok(styles.includes('w_60px'), 'sheet carries the sm width utility');

  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  registerRuntimeData(data.systemName, data.runtimeData);
  const cls = css({ width: ['50px', '60px'] });
  assert.equal(cls.split(' ').filter((s) => s.length > 0).length, 2, `array resolves base + sm classes, got ${cls}`);

  assert.equal(await computedWidth(page, '#narrow-probe'), '50px', 'narrow container paints base width');
  assert.equal(await computedWidth(page, '#wide-probe'), '60px', 'wide container paints sm width');

  const live = page.locator('#live');
  await live.waitFor();
  assert.equal(await computedWidth(page, '#live-probe'), '50px', 'live container starts at base width');
  await live.evaluate((el) => {
    el.style.width = '800px';
  });
  assert.equal(await computedWidth(page, '#live-probe'), '60px', 'widening the container paints sm width');
  await live.evaluate((el) => {
    el.style.width = '400px';
  });
  assert.equal(await computedWidth(page, '#live-probe'), '50px', 'narrowing the container restores base width');
}
