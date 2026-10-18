// late.spec.ts — spec for NEO-NAMER-04, the late-inline-sheet case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// missing live paint, the doubled or missing diagnostic, the broken ordering
// evidence, or the late sheet that drifted from the compiled output.
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
  __lateOrder: { sheetsAtFirstCss: number; readyStateAtFirstCss: string };
}

const SYSTEM = 'neo-namer-04';
const MISS_VALUE = 'cobalt-900';

// One live atom plus one dynamic miss under dev-bundler delivery order: the
// sheet carries the live utility and no cobalt ghost, the late inline style
// is byte-equal to the fresh sync output, css() ran before any sheet existed
// on a still-loading document, live paints ember, miss rests on inherited
// ink with its miss class, and exactly one diagnostic names the true miss.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes(`.${SYSTEM}__c_ember {`), 'sheet carries the live color atom');
  assert.ok(!styles.includes('cobalt'), 'no ghost rule leaks in for the dynamic shade');

  const live = page.locator('#live');
  await live.waitFor();
  const liveCls = await live.evaluate((el) => el.getAttribute('class'));
  assert.equal(liveCls, `${SYSTEM}__c_ember`, `live carries its class, got ${liveCls}`);
  const liveColor = await live.evaluate((el) => getComputedStyle(el).color);
  assert.equal(liveColor, 'rgb(239, 68, 68)', `live paints ember, got ${liveColor}`);

  const order = await live.evaluate(
    (el) => (el.ownerDocument.defaultView as unknown as DiagnosticWindow).__lateOrder,
  );
  assert.equal(order.sheetsAtFirstCss, 0, `css() ran before any sheet existed, got ${order.sheetsAtFirstCss}`);
  assert.notEqual(order.readyStateAtFirstCss, 'complete', 'css() ran on a still-loading document');

  const delivery = await live.evaluate((el) => {
    const doc = el.ownerDocument;
    const injected = doc.querySelector('head style');
    return {
      styles: doc.querySelectorAll('head style').length,
      links: doc.querySelectorAll('link[rel="stylesheet"]').length,
      text: injected?.textContent ?? '',
    };
  });
  assert.equal(delivery.links, 0, 'no linked sheet delivered the rules');
  assert.equal(delivery.styles, 1, `exactly one inline style arrived late, got ${delivery.styles}`);
  assert.equal(
    delivery.text.trim(),
    styles.trim(),
    'the late inline sheet is byte-equal to the fresh sync output',
  );

  const miss = page.locator('#miss');
  await miss.waitFor();
  const missCls = await miss.evaluate((el) => el.getAttribute('class'));
  assert.equal(
    missCls,
    `${SYSTEM}__c_${MISS_VALUE}`,
    `miss carries its miss class, got ${JSON.stringify(missCls)}`,
  );
  const missColor = await miss.evaluate((el) => getComputedStyle(el).color);
  assert.equal(missColor, 'rgb(17, 17, 17)', `miss rests on inherited ink, got ${missColor}`);
  const pageDiags = await miss.evaluate(
    (el) => (el.ownerDocument.defaultView as unknown as DiagnosticWindow).__namerDiagnostics,
  );
  assert.equal(pageDiags.length, 1, `page reports exactly one diagnostic, got ${pageDiags.length}`);
  assert.ok(pageDiags[0]?.includes('color'), `diagnostic names the prop, got ${pageDiags[0]}`);
  assert.ok(pageDiags[0]?.includes(MISS_VALUE), `diagnostic names the value, got ${pageDiags[0]}`);
  assert.ok(pageDiags[0]?.includes('app.js'), `diagnostic names the call site, got ${pageDiags[0]}`);
  assert.ok(!pageDiags[0]?.includes('ember'), `no diagnostic cries wolf for the present rule, got ${pageDiags[0]}`);
}
