// miss.spec.ts — spec for NEO-NAMER-03, the miss-class case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// classless miss, the unpainted probe, or the missing or doubled browser
// diagnostic on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

interface DiagnosticWindow {
  __namerDiagnostics: string[];
}

const SYSTEM = 'neo-namer-03';
const MISS_VALUE = 'cobalt-900';

// One live atom, one dynamic miss: the sheet carries the live utility
// plus the two harvested floor utilities, the live probe paints ember,
// the miss probe carries its constructed miss class on inherited ink,
// and the page reports exactly one diagnostic naming prop and value.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes(`.${SYSTEM}__c_ember {`), 'sheet carries the live color atom');
  assert.ok(!styles.includes('cobalt'), 'no ghost rule leaks in for the dynamic shade');
  assert.ok(styles.includes(`.${SYSTEM}__c_\\#111111 {`), 'sheet carries the harvested ink floor');
  assert.ok(styles.includes(`.${SYSTEM}__c_\\#ef4444 {`), 'sheet carries the harvested ember-hex floor');
  const utilityCount = styles.match(new RegExp(`\\.${SYSTEM}__`, 'g'))?.length ?? 0;
  assert.equal(utilityCount, 3, `sheet carries the live utility plus the harvest floor, got ${utilityCount}`);

  const live = page.locator('#live');
  await live.waitFor();
  const liveCls = await live.evaluate((el) => el.getAttribute('class'));
  assert.equal(liveCls, `${SYSTEM}__c_ember`, `live carries its class, got ${liveCls}`);
  const liveColor = await live.evaluate((el) => getComputedStyle(el).color);
  assert.equal(liveColor, 'rgb(239, 68, 68)', `live paints ember, got ${liveColor}`);

  const miss = page.locator('#miss');
  await miss.waitFor();
  const missColor = await miss.evaluate((el) => getComputedStyle(el).color);
  assert.equal(missColor, 'rgb(17, 17, 17)', `miss rests on inherited ink, got ${missColor}`);
  const pageDiags = await miss.evaluate(
    (el) => (el.ownerDocument.defaultView as unknown as DiagnosticWindow).__namerDiagnostics,
  );
  assert.equal(pageDiags.length, 1, `page reports exactly one diagnostic, got ${pageDiags.length}`);
  assert.ok(pageDiags[0]?.includes('color'), `diagnostic names the prop, got ${pageDiags[0]}`);
  assert.ok(pageDiags[0]?.includes(MISS_VALUE), `diagnostic names the value, got ${pageDiags[0]}`);
  assert.ok(pageDiags[0]?.includes('app.js'), `diagnostic names the call site, got ${pageDiags[0]}`);

  const missCls = await miss.evaluate((el) => el.getAttribute('class'));
  assert.equal(
    missCls,
    `${SYSTEM}__c_${MISS_VALUE}`,
    `miss carries its miss class, got ${JSON.stringify(missCls)}`,
  );
}
