// bare.spec.ts — spec for NEO-GLOBAL-13, the global bare-token case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// verbatim author string, the missing var, or the miscomputed probe.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The world authored bare token spellings in its global rules. The global
// layer prints the var() forms for the family, radius, ring, and ink —
// never the verbatim strings — and the card probe computes the resolved
// radius, ring color, and text color.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const globalOpen = styles.indexOf('@layer global {');
  assert.ok(globalOpen !== -1, 'sheet carries @layer global');
  const globalLayer = styles.slice(globalOpen);
  assert.ok(
    globalLayer.includes('font-family: var(--fonts-sans)'),
    'body rule resolves the bare family',
  );
  assert.ok(
    globalLayer.includes('border-radius: var(--radii-md)'),
    'card rule resolves the bare radius',
  );
  assert.ok(
    globalLayer.includes('outline-color: var(--colors-ui-focus-ring)'),
    'card rule resolves the dotted ring path',
  );
  assert.ok(globalLayer.includes('color: var(--colors-ink)'), 'card rule resolves bare ink');
  assert.ok(!globalLayer.includes('font-family: sans;'), 'no verbatim family survives');
  assert.ok(!globalLayer.includes('border-radius: md'), 'no verbatim radius survives');

  const card = page.locator('#card');
  await card.waitFor();
  assert.equal(
    await card.evaluate((el) => getComputedStyle(el).borderTopLeftRadius),
    '6px',
    'card computes the resolved radius',
  );
  assert.equal(
    await card.evaluate((el) => getComputedStyle(el).outlineColor),
    'rgb(0, 102, 255)',
    'card computes the resolved ring',
  );
  assert.equal(
    await card.evaluate((el) => getComputedStyle(el).color),
    'rgb(17, 17, 17)',
    'card computes the resolved ink',
  );
  assert.ok(
    (await card.evaluate((el) => getComputedStyle(el).fontFamily)).includes('Inter'),
    'card inherits the resolved family stack',
  );
}
