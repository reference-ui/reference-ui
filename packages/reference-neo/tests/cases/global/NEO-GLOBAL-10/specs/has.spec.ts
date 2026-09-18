// has.spec.ts — spec for NEO-GLOBAL-10, the :has() bezel case.
// Takes { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the dropped
// :has() selector, the unpainted bezel, or the dead live toggle on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The world authored a base bezel border plus the lib invalid compound with a
// literal :has() selector. The sheet carries the :has() selector verbatim with
// the token var inside @layer global, and each bezel paints computed: valid
// holds base, invalid and twin paint the red token, and toggling aria-invalid
// on the live input flips its bezel both ways.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const globalOpen = styles.indexOf('@layer global {');
  assert.ok(globalOpen !== -1, 'sheet carries @layer global');
  const globalLayer = styles.slice(globalOpen);
  assert.ok(
    globalLayer.includes('[data-reference-field]:has([aria-invalid="true"])'),
    'global layer carries the literal :has() selector',
  );
  assert.ok(
    globalLayer.includes('[data-reference-field][data-invalid]'),
    'global layer carries the data-invalid twin',
  );
  assert.ok(
    globalLayer.includes('border-color: var(--colors-red-500)'),
    'invalid rule carries the token var',
  );

  async function borderOf(selector: string): Promise<string> {
    const probe = page.locator(selector);
    await probe.waitFor();
    return probe.evaluate((el) => getComputedStyle(el).borderColor);
  }

  assert.equal(
    await borderOf('#valid-bezel'),
    'rgb(209, 213, 219)',
    'valid bezel holds the base border',
  );
  assert.equal(
    await borderOf('#invalid-bezel'),
    'rgb(239, 68, 68)',
    'invalid bezel paints the red token',
  );
  assert.equal(
    await borderOf('#twin-bezel'),
    'rgb(239, 68, 68)',
    'data-invalid twin paints the red token',
  );

  const liveInput = page.locator('#valid-input');
  await liveInput.waitFor();
  await liveInput.evaluate((el) => {
    el.setAttribute('aria-invalid', 'true');
  });
  assert.equal(
    await borderOf('#valid-bezel'),
    'rgb(239, 68, 68)',
    'setting aria-invalid=true flips the bezel to red',
  );
  await liveInput.evaluate((el) => {
    el.setAttribute('aria-invalid', 'false');
  });
  assert.equal(
    await borderOf('#valid-bezel'),
    'rgb(209, 213, 219)',
    'restoring aria-invalid=false restores the base border',
  );
}
