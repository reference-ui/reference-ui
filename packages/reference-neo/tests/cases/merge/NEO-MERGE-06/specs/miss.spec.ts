// miss.spec.ts — spec for NEO-MERGE-06, the miss diagnostic case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the ghost
// utility, the classed miss, or the missing or doubled diagnostic on failure.
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

interface DiagnosticWindow {
  __mergeDiagnostics: string[];
}

// One live atom, one dynamic miss: the sheet carries the live utility
// plus the two harvested floor utilities (the global ink and the ember
// hex the world wrote), the miss probe stays classless on inherited ink,
// and both the page and a node-side call report exactly one diagnostic
// each.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes('.neo-merge-06__c_ember {'), 'sheet carries the live color atom');
  assert.ok(!styles.includes('rust'), 'no ghost rule leaks in for the dynamic shade');
  assert.ok(styles.includes('.neo-merge-06__c_\\#111111 {'), 'sheet carries the harvested ink floor');
  assert.ok(styles.includes('.neo-merge-06__c_\\#ef4444 {'), 'sheet carries the harvested ember-hex floor');
  const utilityCount = styles.match(/\.neo-merge-06__/g)?.length ?? 0;
  assert.equal(utilityCount, 3, `sheet carries the live utility plus the harvest floor, got ${utilityCount}`);

  const live = page.locator('#live');
  await live.waitFor();
  const liveCls = await live.evaluate((el) => el.getAttribute('class'));
  assert.equal(liveCls, 'neo-merge-06__c_ember', `live carries its class, got ${liveCls}`);
  const liveColor = await live.evaluate((el) => getComputedStyle(el).color);
  assert.equal(liveColor, 'rgb(239, 68, 68)', `live paints ember, got ${liveColor}`);

  const miss = page.locator('#miss');
  await miss.waitFor();
  const missCls = await miss.evaluate((el) => el.getAttribute('class'));
  assert.equal(missCls, '', `miss resolves to no class, got ${missCls}`);
  const missColor = await miss.evaluate((el) => getComputedStyle(el).color);
  assert.equal(missColor, 'rgb(17, 17, 17)', `miss rests on inherited ink, got ${missColor}`);
  const pageDiags = await miss.evaluate(
    (el) => (el.ownerDocument.defaultView as unknown as DiagnosticWindow).__mergeDiagnostics,
  );
  assert.equal(pageDiags.length, 1, `page reports exactly one diagnostic, got ${pageDiags.length}`);
  assert.ok(pageDiags[0]?.includes('color'), `diagnostic names the prop, got ${pageDiags[0]}`);
  assert.ok(pageDiags[0]?.includes('rust-500'), `diagnostic names the value, got ${pageDiags[0]}`);
  assert.ok(pageDiags[0]?.includes('app.js'), `diagnostic names the call site, got ${pageDiags[0]}`);

  const dataUrl = pathToFileURL(path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  registerRuntimeData(data.systemName, data.runtimeData);
  const seen: string[] = [];
  const original = console.warn;
  console.warn = (...args: unknown[]) => {
    seen.push(args.map(String).join(' '));
  };
  try {
    const missed = css({ color: 'rust-500' });
    assert.equal(missed, '', `node-side miss resolves to no class, got ${missed}`);
    const lived = css({ color: 'ember' });
    assert.equal(lived, 'neo-merge-06__c_ember', `node-side hit resolves, got ${lived}`);
    const holed = css({ color: null, outlineColor: undefined });
    assert.equal(holed, '', `node-side holes resolve to no class, got ${holed}`);
  } finally {
    console.warn = original;
  }
  assert.equal(seen.length, 1, `node-side reports exactly one diagnostic, got ${seen.length}`);
  assert.ok(seen[0]?.includes('color'), `diagnostic names the prop, got ${seen[0]}`);
  assert.ok(seen[0]?.includes('rust-500'), `diagnostic names the value, got ${seen[0]}`);
  assert.ok(seen[0]?.includes('miss.spec.ts'), `diagnostic names the call site, got ${seen[0]}`);
}
