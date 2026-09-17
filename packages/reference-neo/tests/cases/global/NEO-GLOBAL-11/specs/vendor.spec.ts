// vendor.spec.ts — spec for NEO-GLOBAL-11, the vendor pseudos case.
// Takes { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the renamed
// vendor selector, the missing token var, or the unpainted pseudo on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The world authored two literal vendor selectors with token colours. The sheet
// carries both verbatim inside @layer global with no :is() wrap and no rename,
// and Chromium paints the file-button pseudo computed. The slider thumb is
// sheet-only: this Chromium does not expose author styles through
// getComputedStyle(el, '::-webkit-slider-thumb') — it returns the input's own
// box (see /tmp/neo-global11-debug2.mjs) — so the thumb claim rests on the
// verbatim sheet text plus the file button proving pseudos paint.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const globalOpen = styles.indexOf('@layer global {');
  assert.ok(globalOpen !== -1, 'sheet carries @layer global');
  const globalLayer = styles.slice(globalOpen);

  const thumbOpen = globalLayer.indexOf('.ref-range::-webkit-slider-thumb');
  assert.ok(thumbOpen !== -1, 'global layer carries the literal slider-thumb selector');
  const thumbRule = globalLayer.slice(thumbOpen, globalLayer.indexOf('}', thumbOpen));
  assert.ok(!thumbRule.includes(':is('), `vendor selector gains no twin, got ${thumbRule}`);
  assert.ok(
    thumbRule.includes('background-color: var(--colors-ui-progress-bar-foreground)'),
    `thumb rule carries the token var, got ${thumbRule}`,
  );
  assert.ok(
    thumbRule.includes('width: 24px') && thumbRule.includes('-webkit-appearance: none'),
    `thumb rule keeps size and vendor property verbatim, got ${thumbRule}`,
  );

  const fileOpen = globalLayer.indexOf('.ref-upload::file-selector-button');
  assert.ok(fileOpen !== -1, 'global layer carries the literal file-selector-button selector');
  const fileRule = globalLayer.slice(fileOpen, globalLayer.indexOf('}', fileOpen));
  assert.ok(!fileRule.includes(':is('), `vendor selector gains no twin, got ${fileRule}`);
  assert.ok(
    fileRule.includes('color: var(--colors-ui-file-button)'),
    `file-button rule carries the ink var, got ${fileRule}`,
  );
  assert.ok(
    fileRule.includes('background-color: var(--colors-ui-file-field)'),
    `file-button rule carries the field var, got ${fileRule}`,
  );

  const range = page.locator('#range');
  await range.waitFor();

  const upload = page.locator('#upload');
  await upload.waitFor();
  const fileButton = await upload.evaluate((el) => {
    const style = getComputedStyle(el, '::file-selector-button');
    return { color: style.color, background: style.backgroundColor };
  });
  assert.equal(fileButton.color, 'rgb(248, 250, 252)', `file button paints the ink, got ${fileButton.color}`);
  assert.equal(
    fileButton.background,
    'rgb(15, 23, 42)',
    `file button paints the field, got ${fileButton.background}`,
  );
}
