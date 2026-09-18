// ranges.spec.ts — spec for NEO-RESP-05, the range conditions case.
// Takes { page, case } from the runner with the world freshly synced and the
// page already navigated to it. Emits nothing on success; throws naming the
// missing bounded query, the unresolved call, or the mispainted probe.
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

async function setLiveWidth(page: SpecPage, px: '767px' | '768px'): Promise<void> {
  const live = page.locator('#live');
  await live.waitFor();
  // Evaluate ships the function source to the browser, so each width is a
  // literal baked into its own closure; captured variables would not travel.
  if (px === '768px') {
    await live.evaluate((el) => {
      el.style.width = '768px';
    });
  } else {
    await live.evaluate((el) => {
      el.style.width = '767px';
    });
  }
}

function classCount(cls: string): number {
  return cls.split(' ').filter((s) => s.length > 0).length;
}

// Each range lowers to its epsilon-bounded query at build time, and each of
// the three calls resolves the same two classes at runtime. The browser proof
// parks containers exactly one pixel on either side of every boundary: the
// 0.02px epsilon leaves no width where both sides paint at once.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes('@container (max-width: 767.98px)'), 'sheet carries the mdDown query');
  assert.ok(
    styles.includes('@container (min-width: 768px) and (max-width: 1023.98px)'),
    'sheet carries the mdOnly query'
  );
  assert.ok(
    styles.includes('@container (min-width: 640px) and (max-width: 1023.98px)'),
    'sheet carries the smToLg query'
  );
  assert.ok(styles.includes('w_50px'), 'sheet carries the base width utility');
  assert.ok(styles.includes('w_60px'), 'sheet carries the mdDown width utility');
  assert.ok(styles.includes('w_70px'), 'sheet carries the mdOnly width utility');
  assert.ok(styles.includes('w_80px'), 'sheet carries the smToLg width utility');

  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  registerRuntimeData(data.systemName, data.runtimeData);
  const clsDown = css({ width: '50px', mdDown: { width: '60px' } });
  assert.equal(classCount(clsDown), 2, `mdDown call resolves base + range classes, got ${clsDown}`);
  const clsOnly = css({ width: '50px', mdOnly: { width: '70px' } });
  assert.equal(classCount(clsOnly), 2, `mdOnly call resolves base + range classes, got ${clsOnly}`);
  const clsRange = css({ width: '50px', smToLg: { width: '80px' } });
  assert.equal(classCount(clsRange), 2, `smToLg call resolves base + range classes, got ${clsRange}`);

  assert.equal(await computedWidth(page, '#down767-probe'), '60px', '767px container matches mdDown');
  assert.equal(await computedWidth(page, '#down768-probe'), '50px', '768px container leaves mdDown');
  assert.equal(await computedWidth(page, '#only767-probe'), '50px', '767px container is below mdOnly');
  assert.equal(await computedWidth(page, '#only768-probe'), '70px', '768px container enters mdOnly');
  assert.equal(await computedWidth(page, '#only1023-probe'), '70px', '1023px container is still inside mdOnly');
  assert.equal(await computedWidth(page, '#only1024-probe'), '50px', '1024px container leaves mdOnly');
  assert.equal(await computedWidth(page, '#range639-probe'), '50px', '639px container is below smToLg');
  assert.equal(await computedWidth(page, '#range640-probe'), '80px', '640px container enters smToLg');
  assert.equal(await computedWidth(page, '#range1023-probe'), '80px', '1023px container is still inside smToLg');
  assert.equal(await computedWidth(page, '#range1024-probe'), '50px', '1024px container leaves smToLg');

  assert.equal(await computedWidth(page, '#live-probe'), '50px', 'live container starts below mdOnly');
  await setLiveWidth(page, '768px');
  assert.equal(await computedWidth(page, '#live-probe'), '70px', 'one pixel wider enters mdOnly');
  await setLiveWidth(page, '767px');
  assert.equal(await computedWidth(page, '#live-probe'), '50px', 'one pixel narrower leaves mdOnly');
}
