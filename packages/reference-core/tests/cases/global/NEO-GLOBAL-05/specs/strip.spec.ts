// strip.spec.ts — spec for NEO-GLOBAL-05, the undefined-strip case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the leaked
// stripped key, the unpainted placeholder, or the mis-sized rhythm on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The world spread a flex field base into .ref-input and stripped the flex keys
// with undefined. The sheet carries the rule with no display, align, gap, or
// min/max width declarations while keeping width, plus the placeholder rule;
// the field paints un-flexed with the placeholder colour and rhythm sizes.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const globalOpen = styles.indexOf('@layer global {');
  assert.ok(globalOpen !== -1, 'sheet carries @layer global');
  const globalLayer = styles.slice(globalOpen);
  const ruleOpen = globalLayer.indexOf('.ref-input {');
  assert.ok(ruleOpen !== -1, 'global layer carries the input rule');
  const rule = globalLayer.slice(ruleOpen, globalLayer.indexOf('}', ruleOpen));
  for (const leaked of ['display', 'align-items', 'gap', 'min-width', 'max-width']) {
    assert.ok(!rule.includes(leaked), `stripped ${leaked} stays out, got ${rule}`);
  }
  assert.ok(rule.includes('width: 100%'), `kept width stays in, got ${rule}`);
  assert.ok(
    globalLayer.includes('.ref-input::placeholder'),
    'global layer carries the placeholder rule',
  );
  assert.ok(
    globalLayer.includes('color: var(--colors-ui-field-placeholder)'),
    'placeholder rule carries the token var',
  );

  const field = page.locator('#field');
  await field.waitFor();
  const display = await field.evaluate((el) => getComputedStyle(el).display);
  assert.ok(!display.includes('flex'), `stripped display paints un-flexed, got ${display}`);
  const fontSize = await field.evaluate((el) => getComputedStyle(el).fontSize);
  assert.equal(fontSize, '14px', `fraction rhythm paints its size, got ${fontSize}`);
  const padding = await field.evaluate((el) => getComputedStyle(el).paddingLeft);
  assert.equal(padding, '12px', `whole rhythm paints its size, got ${padding}`);
  const placeholder = await field.evaluate((el) => getComputedStyle(el, '::placeholder').color);
  assert.equal(placeholder, 'rgb(156, 163, 175)', `placeholder paints its colour, got ${placeholder}`);
}
