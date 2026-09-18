// mixed.spec.ts — spec for NEO-COND-15, the mixed at-rule case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// misnested at-rule, the arm that fails to gate, or the resync that drifts.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync } from '../../../../../src/sync/index.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The runner hands specs the real Playwright page, whose hover member the
// narrow SpecPage shape omits; this interface names just that member.
interface HoverPage {
  hover(selector: string): Promise<void>;
}

function readSheet(c: NeoCase): string {
  return fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
}

// One mixed rule nests @supports outside @container with :hover on the
// class; the live probe paints only with the wide root plus a real hover,
// the narrow and bogus probes never paint, and a resync stays identical.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = readSheet(c);
  const supportsAt = styles.indexOf('@supports (display: grid)');
  assert.ok(supportsAt >= 0, 'sheet carries the grid supports rule');
  const containerAt = styles.indexOf('@container (min-width: 640px)', supportsAt);
  assert.ok(containerAt > supportsAt, 'sheet nests the sm container inside the supports rule');
  const hoverAt = styles.indexOf(':hover', containerAt);
  assert.ok(hoverAt > containerAt, 'sheet carries :hover inside the nested container');
  assert.ok(
    !styles.includes(':@supports') && !styles.includes('@supports (display: grid):hover'),
    'sheet never lowers the supports query into a selector',
  );
  assert.ok(
    styles.includes('@supports (display: bogus-magic)'),
    'sheet carries the bogus-query control rule',
  );

  async function paint(selector: string): Promise<string> {
    const probe = page.locator(selector);
    await probe.waitFor();
    return probe.evaluate((el) => getComputedStyle(el).color);
  }

  const hoverPage = page as unknown as HoverPage;
  assert.equal(await paint('#live'), 'rgb(17, 17, 17)', 'live rests on ink without hover');
  await hoverPage.hover('#live');
  assert.equal(await paint('#live'), 'rgb(124, 58, 237)', 'live paints brand on hover');
  await hoverPage.hover('#bogus');
  assert.equal(await paint('#live'), 'rgb(17, 17, 17)', 'leaving the live probe restores ink');

  await hoverPage.hover('#narrow-probe');
  assert.equal(
    await paint('#narrow-probe'),
    'rgb(17, 17, 17)',
    'narrow root keeps ink under hover',
  );
  assert.equal(
    await paint('#bogus'),
    'rgb(17, 17, 17)',
    'bogus supports query never paints',
  );

  await sync(c.worldDir);
  assert.equal(readSheet(c), styles, 'a resync prints the sheet byte-identical');
}
