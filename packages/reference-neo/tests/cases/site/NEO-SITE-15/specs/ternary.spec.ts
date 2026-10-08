// ternary.spec.ts — spec for NEO-SITE-15, the conditional-ternary case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// missing arm utility, the unpainted twin, or the unpainted hover.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

interface HoverPage {
  hover(selector: string): Promise<void>;
}

const BRAND = '.neo-site-15__hover\\:bg-c_brand:is(:hover, [data-hover])';
const PAPER = '.neo-site-15__hover\\:bg-c_paper:is(:hover, [data-hover])';

// Both ternary arms compile: the sheet carries exactly the brand and paper
// hover atoms. The runtime picks brand (no query string), so the data-hover
// twin paints brand without hovering, the probe rests transparent, and a
// real hover paints brand on the probe.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes(BRAND), 'sheet carries the brand arm');
  assert.ok(styles.includes(PAPER), 'sheet carries the paper arm');
  const utilityCount = styles.match(/\.neo-site-15__hover/g)?.length ?? 0;
  assert.equal(utilityCount, 2, `sheet carries exactly the two arm utilities, got ${utilityCount}`);

  async function background(id: string): Promise<string> {
    const node = page.locator(`#${id}`);
    await node.waitFor();
    return node.evaluate((el) => getComputedStyle(el).backgroundColor);
  }

  assert.equal(await background('twin'), 'rgb(124, 58, 237)', 'twin paints brand via data-hover');
  assert.equal(await background('target'), 'rgba(0, 0, 0, 0)', 'probe rests transparent');

  const hoverPage = page as unknown as HoverPage;
  await hoverPage.hover('#target');
  assert.equal(await background('target'), 'rgb(124, 58, 237)', 'real hover paints the brand arm');
}
