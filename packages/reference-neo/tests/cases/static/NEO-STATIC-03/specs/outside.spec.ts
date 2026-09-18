// outside.spec.ts — spec for NEO-STATIC-03, the outside-the-set case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the ghost
// atom, the classed miss, the missing or doubled diagnostic, or the bad
// sibling that synced quietly instead of failing.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import type { NativeRuntimeArtifact } from '@reference-ui/rust/contracts';
import { css, registerRuntimeData } from '@reference-ui/neo/runtime';
import { sync } from '../../../../../src/sync/index.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

interface RuntimeDataModule {
  systemName: string;
  runtimeData: NativeRuntimeArtifact;
}

interface DiagnosticWindow {
  __staticDiagnostics: string[];
}

// One static atom, one runtime hit, one set-miss, one failing sibling: the
// sheet carries the ember utility alone, the hit probe paints ember while
// the gold probe stays classless on inherited ink with exactly one page
// diagnostic, the node-side calls agree, and the bad sibling's unsatisfiable
// staticCss request rejects sync naming the ref with no folder left behind.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes('.neo-static-03__c_ember {'), 'sheet carries the ember atom');
  assert.ok(!styles.includes('.neo-static-03__c_gold'), 'no ghost rule leaks in for gold');
  const utilityCount = styles.match(/\.neo-static-03__/g)?.length ?? 0;
  assert.equal(utilityCount, 1, `sheet carries exactly the static atom, got ${utilityCount}`);

  const hit = page.locator('#hit');
  await hit.waitFor();
  const hitCls = await hit.evaluate((el) => el.getAttribute('class'));
  assert.equal(hitCls, 'neo-static-03__c_ember', `hit carries its class, got ${hitCls}`);
  const hitColor = await hit.evaluate((el) => getComputedStyle(el).color);
  assert.equal(hitColor, 'rgb(239, 68, 68)', `hit paints ember, got ${hitColor}`);

  const miss = page.locator('#miss');
  await miss.waitFor();
  const missCls = await miss.evaluate((el) => el.getAttribute('class'));
  assert.equal(missCls, '', `miss resolves to no class, got ${missCls}`);
  const missColor = await miss.evaluate((el) => getComputedStyle(el).color);
  assert.equal(missColor, 'rgb(17, 17, 17)', `miss rests on inherited ink, got ${missColor}`);
  const pageDiags = await miss.evaluate(
    (el) => (el.ownerDocument.defaultView as unknown as DiagnosticWindow).__staticDiagnostics,
  );
  assert.equal(pageDiags.length, 1, `page reports exactly one diagnostic, got ${pageDiags.length}`);
  assert.ok(pageDiags[0]?.includes('color'), `diagnostic names the prop, got ${pageDiags[0]}`);
  assert.ok(pageDiags[0]?.includes('gold'), `diagnostic names the value, got ${pageDiags[0]}`);
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
    const missed = css({ color: 'gold' });
    assert.equal(missed, '', `node-side miss resolves to no class, got ${missed}`);
    const lived = css({ color: 'ember' });
    assert.equal(lived, 'neo-static-03__c_ember', `node-side hit resolves, got ${lived}`);
  } finally {
    console.warn = original;
  }
  assert.equal(seen.length, 1, `node-side reports exactly one diagnostic, got ${seen.length}`);
  assert.ok(seen[0]?.includes('color'), `diagnostic names the prop, got ${seen[0]}`);
  assert.ok(seen[0]?.includes('gold'), `diagnostic names the value, got ${seen[0]}`);
  assert.ok(seen[0]?.includes('outside.spec.ts'), `diagnostic names the call site, got ${seen[0]}`);

  const failure: unknown = await sync(path.join(c.worldDir, 'bad')).then(
    () => null,
    (err: unknown) => err,
  );
  assert.ok(failure instanceof Error, 'unsatisfiable staticCss request fails sync');
  const message = failure instanceof Error ? failure.message : String(failure);
  assert.match(
    message,
    /unknown token reference `\{colors\.nope\}`/,
    'the rejection names the missing ref',
  );
  assert.ok(
    !fs.existsSync(path.join(c.worldDir, 'bad', '.reference-ui')),
    'failed sync leaves no half-written folder behind',
  );
}
