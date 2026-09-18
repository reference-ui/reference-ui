// attr.spec.ts — spec for NEO-COND-07, the quoted-attribute case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the lost
// escape, the miscounted utility, or the node that paints on the wrong
// side of the attribute boundary on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// Two utilities, one escape, three paints. The open paragraph paints brand
// through the quoted attribute selector while the closed paragraph sharing
// its class keeps ink, and the data-expanded twin paints accent through the
// triple list, proving quotes round-trip from author key to class to paint.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes("\\'open\\'"), 'sheet escapes the attribute quotes in the class');
  assert.ok(
    styles.includes(':is([aria-expanded=true], [data-expanded], [data-state="expanded"])'),
    'sheet keeps the _expanded triple twin list',
  );
  const utilityCount = styles.match(/\.neo-cond-07__/g)?.length ?? 0;
  assert.equal(utilityCount, 2, `sheet carries exactly the wanted utilities, got ${utilityCount}`);

  async function paint(selector: string): Promise<string> {
    const probe = page.locator(selector);
    await probe.waitFor();
    return probe.evaluate((el) => getComputedStyle(el).color);
  }

  const open = await paint('#open');
  assert.equal(open, 'rgb(124, 58, 237)', `open paragraph paints brand, got ${open}`);

  const closed = await paint('#closed');
  assert.equal(closed, 'rgb(17, 17, 17)', `closed paragraph keeps ink, got ${closed}`);

  const expanded = await paint('#expanded');
  assert.equal(expanded, 'rgb(22, 163, 74)', `expanded twin paints accent, got ${expanded}`);
}
