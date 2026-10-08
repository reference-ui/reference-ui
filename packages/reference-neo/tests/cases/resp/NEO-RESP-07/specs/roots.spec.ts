// roots.spec.ts — spec for NEO-RESP-07, the container root case.
// Takes { page, case } from the runner with the world freshly synced and the
// page already navigated to it. Emits nothing on success; throws naming the
// missing container utility, the unresolved class, or the mispainted probe.
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

async function computedContainerType(page: SpecPage, selector: string): Promise<string> {
  const node = page.locator(selector);
  await node.waitFor();
  return node.evaluate((el) => getComputedStyle(el).containerType);
}

// The same responsive class paints per container only where a container-type
// ancestor exists. Both subtrees are 800px wide, so only the root explains
// the 60px versus 50px split; resizing the rooted wrapper flips its probe.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes('container-type: inline-size'), 'sheet carries the container root utility');
  assert.ok(styles.includes('cq-t_inline-size'), 'sheet carries the container macro class');
  assert.ok(styles.includes('@container (min-width: 640px)'), 'sheet carries the sm container rule');

  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  registerRuntimeData(data.systemName, data.runtimeData);
  const root = css({ container: true });
  assert.equal(root.split(' ').filter((s) => s.length > 0).length, 1, `container macro resolves one class, got ${root}`);
  const cls = css({ width: ['50px', '60px'] });
  assert.equal(cls.split(' ').filter((s) => s.length > 0).length, 2, `array resolves base + sm classes, got ${cls}`);

  assert.equal(await computedContainerType(page, '#rooted'), 'inline-size', 'macro wrapper establishes a container root');
  assert.equal(await computedContainerType(page, '#unrooted'), 'normal', 'twin wrapper has no container root');

  assert.equal(await computedWidth(page, '#rooted-probe'), '60px', 'rooted probe paints sm width');
  assert.equal(await computedWidth(page, '#unrooted-probe'), '50px', 'rootless probe keeps base width at the same width');

  const rooted = page.locator('#rooted');
  await rooted.waitFor();
  await rooted.evaluate((el) => {
    el.style.width = '400px';
  });
  assert.equal(await computedWidth(page, '#rooted-probe'), '50px', 'narrowed root restores base width');
  await rooted.evaluate((el) => {
    el.style.width = '800px';
  });
  assert.equal(await computedWidth(page, '#rooted-probe'), '60px', 'rewidened root repaints sm width');
  assert.equal(await computedWidth(page, '#unrooted-probe'), '50px', 'rootless probe still keeps base width');

  const unrooted = page.locator('#unrooted');
  await unrooted.waitFor();
  await unrooted.evaluate((el) => {
    el.style.width = '400px';
  });
  assert.equal(await computedWidth(page, '#unrooted-probe'), '50px', 'resizing the rootless wrapper never matches');
}
