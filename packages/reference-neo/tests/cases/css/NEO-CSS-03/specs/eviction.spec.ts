// eviction.spec.ts — spec for NEO-CSS-03, the alias-eviction case.
// Takes { page, case } from the runner with the world freshly synced and the
// page already navigated to it. Emits nothing on success; throws naming the
// missing atom, the unevicted class, or the mispainted probe.
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

const EVICTED_CLASS = 'neo-css3__w_70px';
const RESPONSIVE_CLASSES = 'neo-css3__w_50px neo-css3__md:w_60px';

async function probeClass(page: SpecPage, selector: string): Promise<string> {
  const probe = page.locator(selector);
  await probe.waitFor();
  return probe.evaluate((el) => (el as HTMLElement).className);
}

async function computedWidth(page: SpecPage, selector: string): Promise<string> {
  const probe = page.locator(selector);
  await probe.waitFor();
  return probe.evaluate((el) => getComputedStyle(el).width);
}

// Build time keeps every atom per MERGE-01, so the sheet carries all three
// utilities; the runtime merge evicts per author order, so the alias call
// resolves to one class painting 70px everywhere while the reversed call
// keeps both responsive members painting per container.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes('@container (min-width: 768px)'), 'sheet carries the md container rule');
  assert.ok(styles.includes('w_50px'), 'sheet carries the base width utility');
  assert.ok(styles.includes('w_60px'), 'sheet carries the md width utility');
  assert.ok(styles.includes('w_70px'), 'sheet carries the alias width utility');
  const utilityCount = styles.match(/\.neo-css3__/g)?.length ?? 0;
  assert.equal(utilityCount, 3, `sheet carries exactly the three utilities, got ${utilityCount}`);

  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  registerRuntimeData(data.systemName, data.runtimeData);
  const evicted = css({ width: { base: '50px', md: '60px' }, w: '70px' });
  assert.equal(evicted, EVICTED_CLASS, `later alias evicts the responsive expansion, got ${evicted}`);
  const responsive = css({ w: '70px', width: { base: '50px', md: '60px' } });
  assert.equal(responsive, RESPONSIVE_CLASSES, `later expansion evicts the bare alias, got ${responsive}`);

  assert.equal(await probeClass(page, '#evicted-narrow'), EVICTED_CLASS, 'narrow alias probe carries one class');
  assert.equal(await probeClass(page, '#evicted-wide'), EVICTED_CLASS, 'wide alias probe carries one class');
  assert.equal(await computedWidth(page, '#evicted-narrow'), '70px', 'narrow container paints alias width');
  assert.equal(await computedWidth(page, '#evicted-wide'), '70px', 'wide container paints alias width');

  assert.equal(await probeClass(page, '#responsive-narrow'), RESPONSIVE_CLASSES, 'narrow responsive probe carries both members');
  assert.equal(await probeClass(page, '#responsive-wide'), RESPONSIVE_CLASSES, 'wide responsive probe carries both members');
  assert.equal(await computedWidth(page, '#responsive-narrow'), '50px', 'narrow container paints base width');
  assert.equal(await computedWidth(page, '#responsive-wide'), '60px', 'wide container paints md width');
}
