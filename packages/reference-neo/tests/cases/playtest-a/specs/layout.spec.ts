// layout.spec.ts — second spec of NEO-SNAP-A-01, proving a case can carry
// multiple specs that run in filename order after the cascade spec. Takes
// { page, snap } from the runner with the page re-navigated to the served
// world. Emits nothing on success; throws on misplaced paint or snapshot drift.
import assert from 'node:assert/strict';
import type { SpecPage } from '../../../shared/page.ts';
import type { SnapFn } from '../../../shared/snapshots.ts';

interface SpecInput {
  page: SpecPage;
  snap: SnapFn;
}

// The layout spec: the row stays one line and the settled render snapshots.
export default async function run({ page, snap }: SpecInput): Promise<void> {
  const dot = page.locator('#dot');
  const chip = page.locator('#chip');
  await dot.waitFor();
  await chip.waitFor();

  const dotBox = await dot.boundingBox();
  const chipBox = await chip.boundingBox();
  assert.ok(dotBox, 'dot has a bounding box');
  assert.ok(chipBox, 'chip has a bounding box');
  assert.ok(dotBox.x < chipBox.x, `dot sits left of chip, got ${dotBox.x} vs ${chipBox.x}`);
  const dotMidY = dotBox.y + dotBox.height / 2;
  const chipMidY = chipBox.y + chipBox.height / 2;
  assert.ok(Math.abs(dotMidY - chipMidY) <= 2, `row shares one baseline, got ${dotMidY} vs ${chipMidY}`);

  await snap(page, 'probe');
}
