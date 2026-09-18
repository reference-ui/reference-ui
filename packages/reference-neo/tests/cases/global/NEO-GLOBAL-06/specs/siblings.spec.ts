// siblings.spec.ts — spec for NEO-GLOBAL-06, the :is() sibling-distribution
// case. Takes { page, case } from the runner with the world freshly synced and
// the page already navigated to it. Emits nothing on success; throws naming
// the undistributed selector, the unwrapped member, or the sibling whose
// margin lands on the wrong side of the leader/second boundary on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// One comma, two members, four margins plus two matches. The sheet keeps the
// base rule on the bare comma and distributes the sibling key per member with
// every combinator member :is()-wrapped (both of them — Panda's snapshot
// leaves the second bare, a bug, not parity); each second sibling carries the
// 10px top margin, each leader stays flush, the second paragraph matches the
// wrapped sibling selector, and a nested paragraph sits outside the wrapped
// member, proving the wrap scopes exactly to body children.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const globalOpen = styles.indexOf('@layer global {');
  assert.ok(globalOpen !== -1, 'sheet carries @layer global');
  const globalLayer = styles.slice(globalOpen);
  assert.ok(globalLayer.includes('body > p, body > ul'), 'sheet keeps the base rule on the bare comma');
  assert.ok(
    globalLayer.includes(':is(body > p) ~ :is(body > p), :is(body > ul) ~ :is(body > ul)'),
    'sheet distributes the sibling key per member with both members wrapped',
  );
  assert.ok(globalLayer.includes('margin-top: 10px'), 'distributed rule carries the sibling margin');

  async function marginTop(selector: string): Promise<string> {
    const probe = page.locator(selector);
    await probe.waitFor();
    return probe.evaluate((el) => getComputedStyle(el).marginTop);
  }

  assert.equal(await marginTop('#first'), '0px', 'leading paragraph stays flush');
  assert.equal(await marginTop('#second'), '10px', 'second paragraph carries the sibling margin');
  assert.equal(await marginTop('#list-first'), '0px', 'leading list stays flush');
  assert.equal(await marginTop('#list-second'), '10px', 'second list carries the sibling margin');

  const second = page.locator('#second');
  await second.waitFor();
  assert.equal(
    await second.evaluate((el) => el.matches(':is(body > p) ~ :is(body > p)')),
    true,
    'second paragraph matches the wrapped sibling selector',
  );
  const nested = page.locator('#nested');
  await nested.waitFor();
  assert.equal(
    await nested.evaluate((el) => el.matches(':is(body > p)')),
    false,
    'nested paragraph sits outside the wrapped member',
  );
}
