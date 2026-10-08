// macros.spec.ts — spec for NEO-CSS-10, the macro-expansion case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// missing expansion, the short class set, or the mispainted probe.
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

// Three macros, five utilities. Size fans out to width+height, font to the
// family var plus the registry normal weight, weight to the bold weight;
// each probe carries its full class set and paints every expansion.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  const utilityCount = styles.match(/\.neo-css10__/g)?.length ?? 0;
  assert.equal(utilityCount, 5, `sheet carries five utilities, got ${utilityCount}`);
  assert.ok(styles.includes('width: 20px;'), 'sheet carries the size width');
  assert.ok(styles.includes('height: 20px;'), 'sheet carries the size height');
  assert.ok(styles.includes('--fonts-sans:'), 'sheet carries the sans family var');
  assert.ok(styles.includes('font-family: var(--fonts-sans);'), 'sheet carries the font family');
  assert.ok(styles.includes('font-weight: 400;'), 'sheet carries the registry normal weight');
  assert.ok(styles.includes('font-weight: 700;'), 'sheet carries the bold weight');

  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  registerRuntimeData(data.systemName, data.runtimeData);
  const size = css({ size: '20px' });
  const font = css({ font: 'sans' });
  const weight = css({ weight: 'bold' });
  assert.equal(size.split(' ').length, 2, `size resolves to two classes, got ${size}`);
  assert.equal(font.split(' ').length, 2, `font resolves to two classes, got ${font}`);
  assert.ok(weight.length > 0, 'weight resolves to a class');

  async function classOf(id: string): Promise<string> {
    const probe = page.locator(`#${id}`);
    await probe.waitFor();
    return probe.evaluate((el) => (el as HTMLElement).className);
  }

  assert.equal(await classOf('size'), size, `size probe carries both classes, got ${await classOf('size')}`);
  assert.equal(await classOf('font'), font, `font probe carries both classes, got ${await classOf('font')}`);
  assert.equal(await classOf('weight'), weight, 'weight probe carries the resolved class');

  const sizeProbe = page.locator('#size');
  await sizeProbe.waitFor();
  assert.equal(await sizeProbe.evaluate((el) => getComputedStyle(el).width), '20px', 'size paints width');
  assert.equal(await sizeProbe.evaluate((el) => getComputedStyle(el).height), '20px', 'size paints height');

  const fontProbe = page.locator('#font');
  await fontProbe.waitFor();
  const family = await fontProbe.evaluate((el) => getComputedStyle(el).fontFamily);
  assert.ok(family.includes('Inter'), `font paints the Inter stack, got ${family}`);
  assert.equal(
    await fontProbe.evaluate((el) => getComputedStyle(el).fontWeight),
    '400',
    'font paints the registry normal weight',
  );

  const weightProbe = page.locator('#weight');
  await weightProbe.waitFor();
  assert.equal(
    await weightProbe.evaluate((el) => getComputedStyle(el).fontWeight),
    '700',
    'weight paints bold',
  );
}
