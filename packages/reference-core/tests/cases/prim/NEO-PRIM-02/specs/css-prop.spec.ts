// css-prop.spec.ts — spec for NEO-PRIM-02, the css-prop case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// utility, the unpainted source, or the conflict the css slot lost on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// Four utilities, two probes, one precedence rule. The first probe paints
// from the sibling props and the css prop at once; the second proves the
// css slot wins when both name the color. The css key itself never lands.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  for (const cls of ['neo-prim2__c_ink', 'neo-prim2__p_sm', 'neo-prim2__bg-c_brand', 'neo-prim2__c_brand']) {
    assert.ok(styles.includes(`.${cls} {`), `sheet carries .${cls}`);
  }
  const utilityCount = styles.match(/\.neo-prim2__/g)?.length ?? 0;
  assert.equal(utilityCount, 4, `sheet carries exactly the wanted utilities, got ${utilityCount}`);

  const both = page.locator('#both');
  await both.waitFor();
  const bothColor = await both.evaluate((el) => getComputedStyle(el).color);
  assert.equal(bothColor, 'rgb(17, 17, 17)', `sibling color paints, got ${bothColor}`);
  const bothBg = await both.evaluate((el) => getComputedStyle(el).backgroundColor);
  assert.equal(bothBg, 'rgb(124, 58, 237)', `css background paints, got ${bothBg}`);
  const bothPad = await both.evaluate((el) => getComputedStyle(el).paddingTop);
  assert.equal(bothPad, '8px', `sibling spacing paints, got ${bothPad}`);

  const conflict = page.locator('#conflict');
  await conflict.waitFor();
  const conflictColor = await conflict.evaluate((el) => getComputedStyle(el).color);
  assert.equal(conflictColor, 'rgb(124, 58, 237)', `css color wins the conflict, got ${conflictColor}`);

  for (const [node, id] of [[both, 'both'], [conflict, 'conflict']] as const) {
    assert.equal(
      await node.evaluate((el) => el.getAttribute('data-layer')),
      'neo-prim2',
      `${id} stamps the system layer`,
    );
    assert.equal(
      await node.evaluate((el) => el.getAttribute('css')),
      null,
      `css prop stays off the ${id} element`,
    );
    assert.equal(
      await node.evaluate((el) => el.getAttribute('color')),
      null,
      `sibling style props stay off the ${id} element`,
    );
  }
}
