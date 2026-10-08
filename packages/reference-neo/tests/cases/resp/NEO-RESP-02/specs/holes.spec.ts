// holes.spec.ts — spec for NEO-RESP-02, the array null-hole case.
// Takes { page, case } from the runner with the world freshly synced and the
// page already navigated to it. Emits nothing on success; throws naming the
// unexpected sm rule, the unresolved array, or the mispainted probe.
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

async function setLiveWidth(page: SpecPage, px: '400px' | '700px' | '800px'): Promise<void> {
  const live = page.locator('#live');
  await live.waitFor();
  // Evaluate ships the function source to the browser, so each width is a
  // literal baked into its own closure; captured variables would not travel.
  if (px === '700px') {
    await live.evaluate((el) => {
      el.style.width = '700px';
    });
  } else if (px === '800px') {
    await live.evaluate((el) => {
      el.style.width = '800px';
    });
  } else {
    await live.evaluate((el) => {
      el.style.width = '400px';
    });
  }
}

// The null hole skips the sm slot at build time, and the same holed array
// resolves the same two classes at runtime. The browser proof parks one
// container inside the sm range: it must still paint base width.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes('@container (min-width: 768px)'), 'sheet carries the md container rule');
  assert.ok(!styles.includes('@container (min-width: 640px)'), 'sheet carries no sm container rule');
  assert.ok(styles.includes('w_50px'), 'sheet carries the base width utility');
  assert.ok(styles.includes('w_60px'), 'sheet carries the md width utility');

  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  registerRuntimeData(data.systemName, data.runtimeData);
  const cls = css({ width: ['50px', null, '60px'] });
  assert.equal(cls.split(' ').filter((s) => s.length > 0).length, 2, `holed array resolves base + md classes, got ${cls}`);

  assert.equal(await computedWidth(page, '#narrow-probe'), '50px', 'narrow container paints base width');
  assert.equal(await computedWidth(page, '#mid-probe'), '50px', 'sm-range container still paints base width');
  assert.equal(await computedWidth(page, '#wide-probe'), '60px', 'md container paints the third slot');

  assert.equal(await computedWidth(page, '#live-probe'), '50px', 'live container starts at base width');
  await setLiveWidth(page, '700px');
  assert.equal(await computedWidth(page, '#live-probe'), '50px', 'sm-range live container keeps base width');
  await setLiveWidth(page, '800px');
  assert.equal(await computedWidth(page, '#live-probe'), '60px', 'md live container paints the third slot');
  await setLiveWidth(page, '400px');
  assert.equal(await computedWidth(page, '#live-probe'), '50px', 'narrowed live container restores base width');
}
