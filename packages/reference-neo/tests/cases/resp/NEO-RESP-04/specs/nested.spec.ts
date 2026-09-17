// nested.spec.ts — spec for NEO-RESP-04, the nested conditions case.
// Takes { page, case } from the runner with the world freshly synced and the
// page already navigated to it. Emits nothing on success; throws naming the
// unnested query, the unresolved call, or the mispainted probe.
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

// The nested call lowers to the md rule inside the sm rule at build time,
// and the same call resolves the same two classes at runtime. The browser
// proof parks one container between the breakpoints: only both queries
// together may paint 60px, so the 700px container keeps base width.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  const smAt = styles.indexOf('@container (min-width: 640px)');
  const mdAt = styles.indexOf('@container (min-width: 768px)');
  const ruleAt = styles.indexOf('w_60px');
  assert.ok(smAt !== -1, 'sheet carries the sm container rule');
  assert.ok(mdAt > smAt, 'sheet nests the md container rule inside the sm rule');
  assert.ok(ruleAt > mdAt, 'sheet carries the nested width utility inside the md rule');
  assert.ok(styles.includes('w_50px'), 'sheet carries the base width utility');

  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  registerRuntimeData(data.systemName, data.runtimeData);
  const cls = css({ width: '50px', sm: { md: { width: '60px' } } });
  assert.equal(cls.split(' ').filter((s) => s.length > 0).length, 2, `nested call resolves base + sm:md classes, got ${cls}`);

  assert.equal(await computedWidth(page, '#narrow-probe'), '50px', 'narrow container paints base width');
  assert.equal(await computedWidth(page, '#mid-probe'), '50px', 'sm-only container keeps base width');
  assert.equal(await computedWidth(page, '#wide-probe'), '60px', 'container matching both queries paints nested width');

  assert.equal(await computedWidth(page, '#live-probe'), '50px', 'live container starts at base width');
  await setLiveWidth(page, '700px');
  assert.equal(await computedWidth(page, '#live-probe'), '50px', 'sm-only live container keeps base width');
  await setLiveWidth(page, '800px');
  assert.equal(await computedWidth(page, '#live-probe'), '60px', 'live container matching both queries paints nested width');
  await setLiveWidth(page, '400px');
  assert.equal(await computedWidth(page, '#live-probe'), '50px', 'narrowed live container restores base width');
}
