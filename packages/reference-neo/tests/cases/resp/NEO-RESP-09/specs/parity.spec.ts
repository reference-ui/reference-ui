// parity.spec.ts — spec for NEO-RESP-09, the build/runtime parity case.
// Takes { page, case } from the runner with the world freshly synced and the
// page already navigated to it. Emits nothing on success; throws naming the
// missing sm rule, the divergent runtime class, or the mispainted probe.
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

const EXPECTED_CLASS = 'neo-resp9__w_50px neo-resp9__sm:w_60px';

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

// The named sm sugar lowers to the sm container rule at build time, and a
// fresh runtime call resolves the exact extracted classes. The browser proof
// checks the DOM carries that same string and resizes one container element,
// reading computed width at each step.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes('@container (min-width: 640px)'), 'sheet carries the sm container rule');
  assert.ok(styles.includes('w_50px'), 'sheet carries the base width utility');
  assert.ok(styles.includes('w_60px'), 'sheet carries the sm width utility');
  const utilityCount = styles.match(/\.neo-resp9__/g)?.length ?? 0;
  assert.equal(utilityCount, 2, `sheet carries base + sm utilities, got ${utilityCount}`);

  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  registerRuntimeData(data.systemName, data.runtimeData);
  const runtime = css({ width: '50px', sm: { width: '60px' } });
  assert.equal(runtime, EXPECTED_CLASS, `runtime call lowers to the compiled classes, got ${runtime}`);

  assert.equal(await domClass(page, '#narrow-probe'), EXPECTED_CLASS, 'narrow probe carries the compiled classes');
  assert.equal(await domClass(page, '#wide-probe'), EXPECTED_CLASS, 'wide probe carries the compiled classes');

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
