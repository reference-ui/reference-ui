// divider.spec.ts — spec for NEO-SITE-17, the const-ternary divider case. Takes
// { page, url, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// arm utility, the unpainted dark divider, or the unpainted light divider.
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

interface DividerBorder {
  color: string;
  width: string;
  style: string;
}

const INK = '.neo-site-17__bd-b-c_ink';
const MIST = '.neo-site-17__bd-b-c_mist';

// Both const-bound arms compile: the sheet carries exactly the ink and mist
// border-color atoms beside the decomposed width and style. The dark load
// paints ink over a 1px solid border; a light reload paints mist through
// the same runtime plan index.
export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes(INK), 'sheet carries the ink arm');
  assert.ok(styles.includes(MIST), 'sheet carries the mist arm');
  const armCount = styles.match(/\.neo-site-17__bd-b-c_/g)?.length ?? 0;
  assert.equal(armCount, 2, `sheet carries exactly the two arm utilities, got ${armCount}`);

  async function border(): Promise<DividerBorder> {
    const node = page.locator('#divider');
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

  const dark = await border();
  assert.equal(dark.color, 'rgb(31, 41, 55)', 'dark load paints the ink arm');
  assert.equal(dark.width, '1px', 'divider keeps its width');
  assert.equal(dark.style, 'solid', 'divider keeps its style');

  await page.goto(`${url}?theme=light`, { waitUntil: 'load' });
  const light = await border();
  assert.equal(light.color, 'rgb(229, 231, 235)', 'light reload paints the mist arm');
}
