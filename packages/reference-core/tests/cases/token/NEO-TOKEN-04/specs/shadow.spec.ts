// shadow.spec.ts — spec for NEO-TOKEN-04, the curly-mix shadow case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the probe
// whose computed shadow missed its reference on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

async function shadowOf(page: SpecPage, id: string): Promise<string> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  return node.evaluate((el) => getComputedStyle(el).boxShadow);
}

// The curly opacity ref inside the shadow value must lower to a color-mix
// over the token var, with the length literals preserved verbatim. The probe
// must compute exactly like the inline mix reference, so engine emit and
// browser paint agree by construction.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(
    styles.includes('box-shadow: 0 0 0 3px color-mix(in srgb, var(--colors-pink-400) 30%, transparent)'),
    'sheet mixes the curly opacity ref inside the shadow value',
  );
  assert.ok(
    !styles.includes('{colors.pink.400/30}'),
    'sheet leaves no unresolved ref behind',
  );

  const probe = await shadowOf(page, 'probe');
  const ref = await shadowOf(page, 'shadow-ref');
  assert.equal(probe, ref, `curly mix computes like the inline reference, got ${probe} vs ${ref}`);
  assert.notEqual(probe, 'none', 'the mixed shadow paints something visible');
}
