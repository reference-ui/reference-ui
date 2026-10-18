// atoms.spec.ts — spec for CORE-STATIC-01, the declared-atoms case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// missing atom, the extra ghost, or the unpainted runtime probe.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { CoreCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: CoreCase;
}

// The world declared two base colors plus a hover color in staticCss with
// no static wants. The sheet carries those three atoms with one declared
// hover :is() wrap; the base probe paints ember and the data-hover twin
// paints gold, both through runtime values that found pre-generated atoms.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('.core-static-01__c_ember'), 'sheet carries the ember atom');
  assert.ok(styles.includes('.core-static-01__c_gold'), 'sheet carries the gold atom');
  const wraps = styles.split(':is(:hover, [data-hover])').length - 1;
  assert.equal(wraps, 1, `sheet carries the one declared hover wrap, got ${wraps}`);
  const utilityCount = styles.match(/\.core-static-01__/g)?.length ?? 0;
  assert.equal(utilityCount, 3, `sheet carries exactly the three declared atoms, got ${utilityCount}`);

  const base = page.locator('#base');
  await base.waitFor();
  const baseCls = await base.evaluate((el) => el.getAttribute('class'));
  assert.equal(baseCls, 'core-static-01__c_ember', `base resolves the static class, got ${baseCls}`);
  const baseColor = await base.evaluate((el) => getComputedStyle(el).color);
  assert.equal(baseColor, 'rgb(239, 68, 68)', `base paints ember, got ${baseColor}`);

  const twin = page.locator('#twin');
  await twin.waitFor();
  const twinCls = await twin.evaluate((el) => el.getAttribute('class'));
  assert.equal(twinCls, 'core-static-01__hover:c_gold', `twin resolves the static hover class, got ${twinCls}`);
  const twinColor = await twin.evaluate((el) => getComputedStyle(el).color);
  // CSS `gold`, not the world token: a complete CSS value is never a token
  // path (Forge §9 fence, H1 — CSS wins over tokens). See the README.
  assert.equal(twinColor, 'rgb(255, 215, 0)', `twin paints hover gold, got ${twinColor}`);
}
