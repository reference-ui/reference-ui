// indicator.spec.ts — spec for NEO-SITE-30, the partial-guard indicator case. Takes
// { page, url, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// arm utility, the unpainted selected indicator, or the unpainted plain tab.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  url: string;
  case: NeoCase;
}

interface TabBorder {
  color: string;
  width: string;
  style: string;
}

const WIDTH = '.neo-site-30__bd-b-w_3px';
const RING = '.neo-site-30__bd-b-c_ring';
const CLEAR = '.neo-site-30__bd-b-c_transparent';

// Both guard arms compile: the sheet carries the shared 3px width beside the
// ring arm and the transparent arm. The selected tab paints a solid ring
// indicator; the plain tab paints the transparent arm through the same
// runtime plan index.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes(WIDTH), 'sheet carries the shared width');
  assert.ok(styles.includes(RING), 'sheet carries the ring arm');
  assert.ok(styles.includes(CLEAR), 'sheet carries the transparent arm');
  const armCount = styles.match(/\.neo-site-30__bd-b-c_/g)?.length ?? 0;
  assert.equal(armCount, 2, `sheet carries exactly the two color arms, got ${armCount}`);

  async function border(id: string): Promise<TabBorder> {
    const node = page.locator(`#${id}`);
    await node.waitFor();
    return node.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        color: cs.borderBottomColor,
        width: cs.borderBottomWidth,
        style: cs.borderBottomStyle,
      };
    });
  }

  const selected = await border('tab-selected');
  assert.equal(selected.color, 'rgb(29, 78, 216)', 'selected tab paints the ring arm');
  assert.equal(selected.width, '3px', 'selected tab keeps its width');
  assert.equal(selected.style, 'solid', 'selected tab keeps its style');

  const plain = await border('tab-plain');
  assert.equal(plain.color, 'rgba(0, 0, 0, 0)', 'plain tab paints the transparent arm');
  assert.equal(plain.width, '3px', 'plain tab keeps its width');
  assert.equal(plain.style, 'solid', 'plain tab keeps its style');
}
