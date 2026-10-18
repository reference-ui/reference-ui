// pseudos.spec.ts — spec for NEO-GLOBAL-04, the quote pseudos case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// pseudo rule, the unpainted colour, or the lost quote glyph on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The world authored one .ref-q rule with a token colour plus before/after
// marks. The sheet carries both pseudo rules in @layer global, and the element
// plus both pseudos paint the token colour computed with their glyphs.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const globalOpen = styles.indexOf('@layer global {');
  assert.ok(globalOpen !== -1, 'sheet carries @layer global');
  const globalLayer = styles.slice(globalOpen);
  assert.ok(globalLayer.includes('.ref-q::before'), 'global layer carries ::before');
  assert.ok(globalLayer.includes('.ref-q::after'), 'global layer carries ::after');

  const quote = page.locator('#quote');
  await quote.waitFor();
  const color = await quote.evaluate((el) => getComputedStyle(el).color);
  assert.equal(color, 'rgb(124, 58, 237)', `quote paints the token colour, got ${color}`);

  const before = await quote.evaluate((el) => {
    const style = getComputedStyle(el, '::before');
    return { color: style.color, content: style.content };
  });
  assert.equal(before.color, 'rgb(124, 58, 237)', `::before paints the colour, got ${before.color}`);
  assert.ok(before.content.includes('“'), `::before paints the open glyph, got ${before.content}`);

  const after = await quote.evaluate((el) => {
    const style = getComputedStyle(el, '::after');
    return { color: style.color, content: style.content };
  });
  assert.equal(after.color, 'rgb(124, 58, 237)', `::after paints the colour, got ${after.color}`);
  assert.ok(after.content.includes('”'), `::after paints the close glyph, got ${after.content}`);
}
