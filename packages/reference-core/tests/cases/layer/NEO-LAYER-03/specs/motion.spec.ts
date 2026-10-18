// motion.spec.ts — spec for NEO-LAYER-03, the keyframes and font-face case.
// Takes { page, case } from the runner with the world freshly synced and the
// page already navigated to it. Emits nothing on success; throws naming the
// misplaced or duplicated at-rule, the still animation, or the lost family.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The world registered one fadeSlide keyframe and one display face. The sheet
// carries each exactly once inside @layer global; the animated probe names
// fadeSlide with a live animation running, and the family probe paints the
// Display stack.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const globalOpen = styles.indexOf('@layer global {');
  assert.ok(globalOpen !== -1, 'sheet carries @layer global');
  const tokensOpen = styles.indexOf('@layer tokens {', globalOpen);
  const globalLayer = tokensOpen === -1 ? styles.slice(globalOpen) : styles.slice(globalOpen, tokensOpen);
  assert.equal(
    styles.match(/@keyframes fadeSlide \{/g)?.length ?? 0,
    1,
    'sheet carries @keyframes fadeSlide exactly once',
  );
  assert.ok(
    globalLayer.includes('@keyframes fadeSlide {'),
    'the keyframes print inside @layer global',
  );
  assert.ok(
    globalLayer.includes('from { opacity: 0; }') && globalLayer.includes('to { opacity: 1; }'),
    'the keyframes carry their from/to bodies',
  );
  assert.equal(
    styles.match(/@font-face \{/g)?.length ?? 0,
    1,
    'sheet carries @font-face exactly once',
  );
  assert.ok(
    globalLayer.includes('@font-face {'),
    'the font-face prints inside @layer global',
  );
  assert.ok(
    globalLayer.includes('font-family: Display;'),
    'the font-face names the Display family',
  );

  const anim = page.locator('#anim');
  await anim.waitFor();
  assert.equal(
    await anim.evaluate((el) => getComputedStyle(el).animationName),
    'fadeSlide',
    'animated probe names fadeSlide computed',
  );
  assert.ok(
    (await anim.evaluate((el) => el.getAnimations().length)) >= 1,
    'the animation runs on the element',
  );

  const fontprobe = page.locator('#fontprobe');
  await fontprobe.waitFor();
  const family = await fontprobe.evaluate((el) => getComputedStyle(el).fontFamily);
  assert.ok(
    family.includes('Display'),
    `family probe paints the Display stack, got ${family}`,
  );
}
