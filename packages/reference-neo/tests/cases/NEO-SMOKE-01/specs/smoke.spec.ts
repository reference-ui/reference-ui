// smoke.spec.ts — spec for NEO-SMOKE-01, the smallest honest neo case. Takes
// { page, snap } from the runner with the page already navigated to the
// served world. Emits nothing on success; throws an assertion error naming the
// mismatch (dot color off-crimson, off-center, or snapshot drift) on failure.
import assert from 'node:assert/strict';
import type { SpecPage } from '../../../shared/page.ts';
import type { SnapFn } from '../../../shared/snapshots.ts';

interface SpecInput {
  page: SpecPage;
  snap: SnapFn;
}

// Smallest honest spec: the dot paints crimson and sits centered.
export default async function run({ page, snap }: SpecInput): Promise<void> {
  const dot = page.locator('#dot');
  await dot.waitFor();

  const bg = await dot.evaluate((el) => getComputedStyle(el).backgroundColor);
  assert.equal(bg, 'rgb(220, 20, 60)', `dot color is crimson, got ${bg}`);

  const box = await dot.boundingBox();
  assert.ok(box, 'dot has a bounding box');
  const vp = page.viewportSize();
  assert.ok(vp, 'page has a viewport size');
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  assert.ok(Math.abs(cx - vp.width / 2) <= 2, `dot centered horizontally, got cx=${cx} vp=${vp.width}`);
  assert.ok(Math.abs(cy - vp.height / 2) <= 2, `dot centered vertically, got cy=${cy} vp=${vp.height}`);

  await snap(page, 'dot');
}
