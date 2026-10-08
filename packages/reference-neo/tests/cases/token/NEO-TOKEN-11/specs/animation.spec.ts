// animation.spec.ts — spec for NEO-TOKEN-11, the keyframes emission case.
// Takes { page, case } from the runner with the world freshly synced and the
// page already navigated to it. Emits nothing on success; throws naming the
// probe whose computed animation missed its reference on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

async function animationNameOf(page: SpecPage, id: string): Promise<string> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  return node.evaluate((el) => getComputedStyle(el).animationName);
}

// The keyframes print once inside the global layer while the animation token
// references them by name; the probe consumes the token by var() and computes
// the same animation name as its inline reference.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const globalIdx = styles.indexOf('@layer global');
  const keyframesIdx = styles.indexOf('@keyframes fadeIn');
  assert.ok(globalIdx >= 0, 'sheet prints a global layer');
  assert.ok(keyframesIdx > globalIdx, 'sheet prints @keyframes fadeIn inside @layer global');
  const tokensIdx = styles.indexOf('@layer tokens');
  assert.ok(
    tokensIdx < 0 || keyframesIdx < tokensIdx,
    'the keyframes sit before the tokens layer, not after global',
  );
  assert.equal(
    styles.split('@keyframes fadeIn').length - 1,
    1,
    'sheet prints @keyframes fadeIn exactly once',
  );
  assert.ok(
    styles.includes('--animations-fade-quick: fadeIn 0.2s ease-out'),
    'sheet carries the animation token referencing the keyframes',
  );
  assert.ok(
    styles.includes('animation: var(--animations-fade-quick)'),
    'the utility consumes the animation token by var()',
  );

  const probe = await animationNameOf(page, 'probe');
  const ref = await animationNameOf(page, 'anim-ref');
  assert.equal(probe, ref, `animation token computes like its reference, got ${probe} vs ${ref}`);
  assert.equal(probe, 'fadeIn', 'the probe animates under the fadeIn keyframes');
}
