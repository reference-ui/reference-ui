// resize.spec.ts — spec for NEO-RESP-08, the numeric r key case.
// Takes { page, case } from the runner with the world freshly synced and the
// page already navigated to it. Emits nothing on success; throws naming the
// missing 300px rule, the divergent sugar class, or the mispainted probe.
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

const EXPECTED_CLASS = 'neo-resp8__w_50px neo-resp8__[@container_(min-width:_300px)]:w_60px';

async function computedWidth(page: SpecPage, selector: string): Promise<string> {
  const probe = page.locator(selector);
  await probe.waitFor();
  return probe.evaluate((el) => getComputedStyle(el).width);
}

async function domClass(page: SpecPage, selector: string): Promise<string> {
  const probe = page.locator(selector);
  await probe.waitFor();
  return probe.evaluate((el) => el.className);
}

// The numeric r key lowers to the concrete 300px container query at build
// time, and the same sugar resolves the same two classes at runtime. The
// browser proof resizes one container element across 300px and reads computed
// width at each step.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes('@container (min-width: 300px)'), 'sheet carries the 300px container rule');
  assert.ok(styles.includes('w_50px'), 'sheet carries the base width utility');
  assert.ok(styles.includes('w_60px'), 'sheet carries the 300px width utility');
  const utilityCount = styles.match(/\.neo-resp8__/g)?.length ?? 0;
  assert.equal(utilityCount, 2, `sheet carries base + 300px utilities, got ${utilityCount}`);

  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  registerRuntimeData(data.systemName, data.runtimeData);
  const sugared = css({ width: '50px', r: { 300: { width: '60px' } } });
  const direct = css({ width: '50px', '@container (min-width: 300px)': { width: '60px' } });
  assert.equal(sugared, EXPECTED_CLASS, `r sugar lowers to the compiled classes, got ${sugared}`);
  assert.equal(direct, EXPECTED_CLASS, `direct form matches the compiled classes, got ${direct}`);

  assert.equal(await domClass(page, '#narrow-probe'), EXPECTED_CLASS, 'narrow probe carries the compiled classes');
  assert.equal(await domClass(page, '#wide-probe'), EXPECTED_CLASS, 'wide probe carries the compiled classes');

  assert.equal(await computedWidth(page, '#narrow-probe'), '50px', 'narrow container paints base width');
  assert.equal(await computedWidth(page, '#wide-probe'), '60px', 'wide container paints 300px width');

  const live = page.locator('#live');
  await live.waitFor();
  assert.equal(await computedWidth(page, '#live-probe'), '50px', 'live container starts at base width');
  await live.evaluate((el) => {
    el.style.width = '400px';
  });
  assert.equal(await computedWidth(page, '#live-probe'), '60px', 'widening past 300px paints 300px width');
  await live.evaluate((el) => {
    el.style.width = '200px';
  });
  assert.equal(await computedWidth(page, '#live-probe'), '50px', 'narrowing below 300px restores base width');
}
