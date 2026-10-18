// mix.spec.ts — spec for NEO-TOKEN-03, the slash-opacity color-mix case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the probe
// whose computed background missed its reference on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

async function backgroundOf(page: SpecPage, id: string): Promise<string> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  return node.evaluate((el) => getComputedStyle(el).backgroundColor);
}

// Slash opacity lowers to color-mix; a slash inside a CSS rgb() value passes
// through untouched. Each probe must compute exactly what its inline-style
// reference computes, so engine emit and browser paint agree by construction.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(
    styles.includes('color-mix(in srgb, var(--colors-red-500) 40%, transparent)'),
    'sheet lowers red.500/40 to a color-mix',
  );
  assert.ok(
    styles.includes('rgb(251 146 60 / 0.3)'),
    'sheet passes the rgb() slash value through untouched',
  );
  assert.ok(
    !styles.includes('color-mix(in srgb, rgb(251 146 60 / 0.3)'),
    'sheet never mixes the passthrough value',
  );

  const probe = await backgroundOf(page, 'probe');
  const mixRef = await backgroundOf(page, 'mix-ref');
  assert.equal(probe, mixRef, `red.500/40 computes like the color-mix reference, got ${probe} vs ${mixRef}`);
  assert.notEqual(probe, 'rgba(0, 0, 0, 0)', 'the mix paints something visible');

  const passthrough = await backgroundOf(page, 'passthrough');
  const passRef = await backgroundOf(page, 'pass-ref');
  assert.equal(
    passthrough,
    passRef,
    `the rgb() slash value computes like its reference, got ${passthrough} vs ${passRef}`,
  );
}
