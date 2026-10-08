// important.spec.ts — spec for NEO-CSS-08, the important-spelling case.
// Takes { page, case } from the runner with the world freshly synced and the
// page already navigated to it. Emits nothing on success; throws naming the
// divergent spelling, the beaten important, or the mangled content on failure.
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

// Three important spellings collapse to one utility that beats the later
// plain blue in computed color, while the quoted content bang stays a
// literal string in an unimportant rule.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  const utilityCount = styles.match(/\.neo-css8__/g)?.length ?? 0;
  assert.equal(utilityCount, 3, `sheet carries three utilities, got ${utilityCount}`);
  assert.ok(styles.includes('color: red !important;'), 'sheet carries the important red rule');
  const redRules = styles.split('color: red !important;').length - 1;
  assert.equal(redRules, 1, `three spellings dedup to one important rule, got ${redRules}`);
  assert.ok(styles.includes('color: yellow;'), 'sheet carries the plain yellow rule');
  const redAt = styles.indexOf('color: red !important;');
  const plainAt = styles.indexOf('color: yellow;');
  assert.ok(plainAt > redAt, 'plain yellow prints later than important red, so only !important can win');
  assert.ok(styles.includes('content: "hello!";'), 'sheet carries the intact content string');
  assert.ok(!styles.includes('content: "hello!" !important;'), 'quoted bang never marks importance');

  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  registerRuntimeData(data.systemName, data.runtimeData);
  const bang = css({ color: 'red!' });
  const spaced = css({ color: 'red !important' });
  const upper = css({ color: 'red!IMPORTANT' });
  assert.ok(bang.length > 0, 'bang spelling resolves to a class');
  assert.equal(spaced, bang, `spaced spelling matches the bang class, got ${spaced}`);
  assert.equal(upper, bang, `cased spelling matches the bang class, got ${upper}`);
  const plain = css({ color: 'yellow' });
  assert.ok(plain.length > 0 && plain !== bang, `plain yellow resolves apart, got ${plain}`);
  const content = css({ content: '"hello!"' });
  assert.ok(content.length > 0, 'quoted content resolves to a class');

  for (const id of ['bang', 'spaced', 'upper']) {
    const probe = page.locator(`#${id}`);
    await probe.waitFor();
    const cls = await probe.evaluate((el) => (el as HTMLElement).className);
    assert.equal(cls, `${bang} ${plain}`, `#${id} carries important plus plain, got ${cls}`);
    const color = await probe.evaluate((el) => getComputedStyle(el).color);
    assert.equal(color, 'rgb(255, 0, 0)', `#${id} paints important red over later plain, got ${color}`);
  }

  const plainProbe = page.locator('#plain');
  await plainProbe.waitFor();
  const plainCls = await plainProbe.evaluate((el) => (el as HTMLElement).className);
  assert.equal(plainCls, plain, `plain probe carries the plain class alone, got ${plainCls}`);
  const plainColor = await plainProbe.evaluate((el) => getComputedStyle(el).color);
  assert.equal(plainColor, 'rgb(255, 255, 0)', `plain alone paints yellow, got ${plainColor}`);

  const contentProbe = page.locator('#content');
  await contentProbe.waitFor();
  const contentCls = await contentProbe.evaluate((el) => (el as HTMLElement).className);
  assert.equal(contentCls, content, `content probe carries the quoted class, got ${contentCls}`);
}
