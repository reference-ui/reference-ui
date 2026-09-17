// order.spec.ts — spec for NEO-RESP-06, the query order case.
// Takes { page, case } from the runner with the world freshly synced and the
// page already navigated to it. Emits nothing on success; throws naming the
// misordered block, the unresolved call, or the mispainted probe.
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

async function setLiveWidth(page: SpecPage, px: '700px' | '800px' | '1100px'): Promise<void> {
  const live = page.locator('#live');
  await live.waitFor();
  // Evaluate ships the function source to the browser, so each width is a
  // literal baked into its own closure; captured variables would not travel.
  if (px === '800px') {
    await live.evaluate((el) => {
      el.style.width = '800px';
    });
  } else if (px === '1100px') {
    await live.evaluate((el) => {
      el.style.width = '1100px';
    });
  } else {
    await live.evaluate((el) => {
      el.style.width = '700px';
    });
  }
}

// The array-plus-ranges call lowers to min-width blocks ascending followed by
// max-width blocks descending, and the same call resolves all nine classes at
// runtime. The browser proof parks containers where several queries overlap:
// equal-specificity rules cascade to the last matching block in sheet order.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  const blocks = [
    '@container (min-width: 640px)',
    '@container (min-width: 768px)',
    '@container (min-width: 1024px)',
    '@container (min-width: 1280px)',
    '@container (min-width: 1536px)',
    '@container (max-width: 1023.98px)',
    '@container (max-width: 767.98px)',
    '@container (max-width: 639.98px)',
  ];
  let prev = -1;
  for (const block of blocks) {
    const at = styles.indexOf(block);
    assert.ok(at > prev, `sheet orders ${block} after the previous block`);
    prev = at;
  }
  assert.ok(styles.includes('w_50px'), 'sheet carries the base width utility');
  assert.ok(styles.includes('w_100px'), 'sheet carries the 2xl width utility');
  assert.ok(styles.includes('w_130px'), 'sheet carries the smDown width utility');

  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  registerRuntimeData(data.systemName, data.runtimeData);
  const cls = css({
    width: ['50px', '60px', '70px', '80px', '90px', '100px'],
    lgDown: { width: '110px' },
    mdDown: { width: '120px' },
    smDown: { width: '130px' },
  });
  assert.equal(cls.split(' ').filter((s) => s.length > 0).length, 9, `array-plus-ranges call resolves nine classes, got ${cls}`);

  assert.equal(await computedWidth(page, '#c500-probe'), '130px', '500px container cascades to smDown');
  assert.equal(await computedWidth(page, '#c700-probe'), '120px', '700px container cascades to mdDown');
  assert.equal(await computedWidth(page, '#c800-probe'), '110px', '800px container cascades to lgDown');
  assert.equal(await computedWidth(page, '#c1100-probe'), '80px', '1100px container cascades to lg');
  assert.equal(await computedWidth(page, '#c1400-probe'), '90px', '1400px container cascades to xl');
  assert.equal(await computedWidth(page, '#c1600-probe'), '100px', '1600px container cascades to 2xl');

  assert.equal(await computedWidth(page, '#live-probe'), '120px', 'live container starts at mdDown');
  await setLiveWidth(page, '800px');
  assert.equal(await computedWidth(page, '#live-probe'), '110px', 'wider live container cascades to lgDown');
  await setLiveWidth(page, '1100px');
  assert.equal(await computedWidth(page, '#live-probe'), '80px', 'widest live container cascades to lg');
  await setLiveWidth(page, '700px');
  assert.equal(await computedWidth(page, '#live-probe'), '120px', 'narrowed live container restores mdDown');
}
