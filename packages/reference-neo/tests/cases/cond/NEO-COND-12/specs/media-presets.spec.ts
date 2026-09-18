// media-presets.spec.ts — spec for NEO-COND-12, the media preset case.
// Takes { page, case } from the runner with the world freshly synced and
// the page already navigated to it. Emits nothing on success; throws
// naming the missing at-rule, the miscounted utility, or the preset arm
// that fails to flip under emulation on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The runner hands specs the real Playwright page, whose emulateMedia
// member the narrow SpecPage shape omits; this interface names just the
// options the preset arms flip under.
interface EmulatePage {
  emulateMedia(opts: {
    media?: 'screen' | 'print';
    colorScheme?: 'light' | 'dark' | 'no-preference';
    reducedMotion?: 'reduce' | 'no-preference';
  }): Promise<void>;
}

// Six utilities, three at-rules, six paints. The sheet carries a base
// plus a preset arm per target inside the motion, scheme, and print
// lists, and each target rests on its base, flips computed style under
// the matching emulation, and flips back when emulation resets.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const hits = styles.match(/\.neo-cond-12__[^{\s,]*/g) ?? [];
  assert.equal(new Set(hits).size, 6, `sheet mints six classes, got ${new Set(hits).size}`);
  assert.ok(
    styles.includes('@media (prefers-reduced-motion: reduce)'),
    'sheet carries the reduced-motion list',
  );
  assert.ok(
    styles.includes('@media (prefers-color-scheme: dark)'),
    'sheet carries the dark-scheme list',
  );
  assert.ok(styles.includes('@media print'), 'sheet carries the print list');

  const mediaPage = page as unknown as EmulatePage;
  const motion = page.locator('#motion');
  await motion.waitFor();
  const spinning = await motion.evaluate((el) => getComputedStyle(el).animationName);
  assert.equal(spinning, 'spin', `motion spins at rest, got ${spinning}`);

  await mediaPage.emulateMedia({ reducedMotion: 'reduce' });
  const stilled = await motion.evaluate((el) => getComputedStyle(el).animationName);
  assert.equal(stilled, 'none', `reduced motion stops the spin, got ${stilled}`);

  await mediaPage.emulateMedia({ reducedMotion: 'no-preference' });
  const respun = await motion.evaluate((el) => getComputedStyle(el).animationName);
  assert.equal(respun, 'spin', `reset restarts the spin, got ${respun}`);

  const scheme = page.locator('#scheme');
  await scheme.waitFor();
  const lighted = await scheme.evaluate((el) => getComputedStyle(el).color);
  assert.equal(lighted, 'rgb(17, 17, 17)', `scheme rests on ink, got ${lighted}`);

  await mediaPage.emulateMedia({ colorScheme: 'dark' });
  const darked = await scheme.evaluate((el) => getComputedStyle(el).color);
  assert.equal(darked, 'rgb(124, 58, 237)', `dark scheme paints brand, got ${darked}`);

  await mediaPage.emulateMedia({ colorScheme: 'light' });
  const relighted = await scheme.evaluate((el) => getComputedStyle(el).color);
  assert.equal(relighted, 'rgb(17, 17, 17)', `light scheme restores ink, got ${relighted}`);

  const paper = page.locator('#paper');
  await paper.waitFor();
  const screened = await paper.evaluate((el) => getComputedStyle(el).display);
  assert.equal(screened, 'block', `paper shows on screen, got ${screened}`);

  await mediaPage.emulateMedia({ media: 'print' });
  const printed = await paper.evaluate((el) => getComputedStyle(el).display);
  assert.equal(printed, 'none', `print hides the block, got ${printed}`);

  await mediaPage.emulateMedia({ media: 'screen' });
  const rescreened = await paper.evaluate((el) => getComputedStyle(el).display);
  assert.equal(rescreened, 'block', `screen shows the block again, got ${rescreened}`);
}
