// paint.spec.ts — spec for NEO-CSS-14, the harvest floor case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// unpainted palette color, the classed miss, the missing or doubled
// diagnostic, or the bundle that failed to fan the floor out.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

// The rs dist type entries cannot resolve under NodeNext (see
// src/sync/native.ts), so the recompile below describes the call boundary
// structurally instead of importing the atomic types.
interface AtomicDiagnostic {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  file?: string;
}

interface AtomicModule {
  compile(request: unknown): Promise<{
    diagnostics: AtomicDiagnostic[]
    compilerDiagnostics?: AtomicDiagnostic[]
  }>;
}

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

interface HarvestWindow {
  __css14Diagnostics: string[];
  __cssProbe: (shade: string) => string;
}

// A dynamic-site color from a palette array no static site reads paints
// through harvested plans; an unwritten color paints nothing with exactly
// one dev console diagnostic. Both published bundles carry the floor.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes('.neo-css14__c_red {'), 'sheet carries the harvested red floor');
  assert.ok(styles.includes('.neo-css14__c_blue {'), 'sheet carries the harvested blue floor');
  const utilityCount = styles.match(/\.neo-css14__/g)?.length ?? 0;
  assert.equal(utilityCount, 3, `sheet carries the palette floor plus the ink floor, got ${utilityCount}`);

  const probe = page.locator('#probe');
  await probe.waitFor();
  const probeCls = await probe.evaluate((el) => el.getAttribute('class'));
  assert.equal(probeCls, 'neo-css14__c_red', `probe carries the harvested class, got ${probeCls}`);
  const probeColor = await probe.evaluate((el) => getComputedStyle(el).color);
  assert.equal(probeColor, 'rgb(255, 0, 0)', `probe paints palette red, got ${probeColor}`);

  const loadDiags = await probe.evaluate(
    (el) => (el.ownerDocument.defaultView as unknown as HarvestWindow).__css14Diagnostics,
  );
  assert.equal(loadDiags.length, 0, `harvested hits report no diagnostics, got ${loadDiags.length}`);

  const pickCls = await probe.evaluate(
    (el) => (el.ownerDocument.defaultView as unknown as HarvestWindow).__cssProbe('blue'),
  );
  assert.equal(pickCls, 'neo-css14__c_blue', `runtime blue resolves the harvested class, got ${pickCls}`);
  const pick = page.locator('#pick');
  await pick.evaluate((el) => {
    const win = el.ownerDocument.defaultView as unknown as HarvestWindow;
    el.setAttribute('class', win.__cssProbe('blue'));
  });
  const pickColor = await pick.evaluate((el) => getComputedStyle(el).color);
  assert.equal(pickColor, 'rgb(0, 0, 255)', `pick paints palette blue, got ${pickColor}`);

  const missCls = await probe.evaluate(
    (el) => (el.ownerDocument.defaultView as unknown as HarvestWindow).__cssProbe('hotpink'),
  );
  assert.equal(missCls, '', `unwritten shade resolves to no class, got ${missCls}`);
  const miss = page.locator('#miss');
  await miss.evaluate((el) => el.setAttribute('class', ''));
  const missColor = await miss.evaluate((el) => getComputedStyle(el).color);
  assert.equal(missColor, 'rgb(17, 17, 17)', `miss rests on inherited ink, got ${missColor}`);
  const missDiags = await miss.evaluate(
    (el) => (el.ownerDocument.defaultView as unknown as HarvestWindow).__css14Diagnostics,
  );
  assert.equal(missDiags.length, 1, `page reports exactly one diagnostic, got ${missDiags.length}`);
  assert.ok(missDiags[0]?.includes('color'), `diagnostic names the prop, got ${missDiags[0]}`);
  assert.ok(missDiags[0]?.includes('hotpink'), `diagnostic names the value, got ${missDiags[0]}`);

  const styledData = fs.readFileSync(path.join(outDir, 'styled/runtime-data.mjs'), 'utf8');
  assert.ok(styledData.includes('neo-css14__c_red'), 'styled bundle carries the red plan');
  assert.ok(styledData.includes('neo-css14__c_blue'), 'styled bundle carries the blue plan');
  const reactBundle = fs.readFileSync(path.join(outDir, 'react/react.mjs'), 'utf8');
  assert.ok(reactBundle.includes('neo-css14__c_red'), 'react bundle carries the red plan');
  assert.ok(reactBundle.includes('neo-css14__c_blue'), 'react bundle carries the blue plan');

  const request = JSON.parse(
    fs.readFileSync(path.join(outDir, 'system/compile-request.json'), 'utf8'),
  );
  const atomic = (await import('@reference-ui/rust/atomic')) as unknown as AtomicModule;
  const result = await atomic.compile(request);
  // S6 E8-class re-point: dynamic refusals prove no exact runtime miss, so
  // the default is silent; the same lines ride the opt-in channel.
  assert.equal((result.diagnostics ?? []).length, 0, `default is silent, got ${JSON.stringify(result.diagnostics)}`);
  const opted = await atomic.compile({ ...request, logs: ['compiler'] });
  assert.ok(opted.compilerDiagnostics, 'opt-in channel populates compilerDiagnostics');
  const channel = opted.compilerDiagnostics ?? [];
  const warnings = channel.filter((entry) => entry.severity === 'warning');
  const infos = channel.filter((entry) => entry.code === 'ATM-I-HARVEST-SINK');
  assert.equal(warnings.length, 2, `two dynamic-site warnings, got ${JSON.stringify(channel)}`);
  assert.equal(warnings[0]?.code, 'ATM-W-DYNAMIC-MEMBER');
  assert.equal(warnings[1]?.code, 'ATM-W-DYNAMIC-IDENTIFIER');
  for (const warning of warnings) {
    assert.ok(
      warning?.file?.endsWith(path.join('src', 'app.ts')),
      `warning is located at the world app.ts, got ${warning?.file}`,
    );
  }
  assert.equal(infos.length, 1, `one sink info, got ${JSON.stringify(channel)}`);
  assert.equal(infos[0]?.code, 'ATM-I-HARVEST-SINK');
  assert.equal(infos[0]?.message, 'color under []: 3 harvested values minted');
}
