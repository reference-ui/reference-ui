// cascade.spec.ts — first spec of NEO-SNAP-A-01, proving computed-style
// assertion patterns against the probe world. Takes { page } from the runner
// with the page already navigated to the served world. Emits nothing on
// success; throws naming the offending property when a computed style drifts.
import assert from 'node:assert/strict';
import type { SpecPage } from '../../../shared/page.ts';
import type { SnapFn } from '../../../shared/snapshots.ts';

interface SpecInput {
  page: SpecPage;
  snap: SnapFn;
}

async function computedBg(page: SpecPage, selector: string): Promise<string> {
  const node = page.locator(selector);
  await node.waitFor();
  return node.evaluate((el) => getComputedStyle(el).backgroundColor);
}

// The cascade spec: swatches paint their colors and the id rule beats the class.
export default async function run({ page }: SpecInput): Promise<void> {
  const dot = await computedBg(page, '#dot');
  assert.equal(dot, 'rgb(220, 20, 60)', `dot paints crimson, got ${dot}`);

  const chip = await computedBg(page, '#chip');
  assert.equal(chip, 'rgb(0, 128, 128)', `chip paints teal, got ${chip}`);

  const winner = page.locator('#winner');
  await winner.waitFor();
  const ink = await winner.evaluate((el) => getComputedStyle(el).color);
  assert.equal(ink, 'rgb(0, 128, 0)', `id rule beats class rule, got ${ink}`);
}
