// twins.spec.ts — spec for NEO-COND-14, the placeholder/file/checked case.
// Takes { page, case } from the runner with the world freshly synced and
// the page already navigated to it. Emits nothing on success; throws naming
// the missing twin selector or the probe whose paint stays unpainted.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The sheet pairs ::placeholder with its [data-placeholder] twin, lowers
// _file to ::file-selector-button, and twins _checked four ways; the
// placeholder, the file button, the checked box, and the data-state twin
// each paint their leaf.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('::placeholder'), 'sheet carries the placeholder pseudo');
  assert.ok(
    styles.includes('[data-placeholder]'),
    'sheet carries the placeholder data twin',
  );
  assert.ok(
    styles.includes('::file-selector-button'),
    'sheet lowers _file to the file-selector button',
  );
  assert.ok(
    styles.includes(':is(:checked, [data-checked], [aria-checked=true], [data-state="checked"])'),
    'sheet twins _checked four ways',
  );
  assert.ok(!styles.includes('Unknown condition'), 'sheet carries no unknown-condition trace');

  const name = page.locator('#name');
  await name.waitFor();
  assert.equal(
    await name.evaluate((el) => getComputedStyle(el, '::placeholder').color),
    'rgb(239, 68, 68)',
    'placeholder paints hint',
  );

  const upload = page.locator('#upload');
  await upload.waitFor();
  assert.equal(
    await upload.evaluate((el) => getComputedStyle(el, '::file-selector-button').color),
    'rgb(59, 130, 246)',
    'file button paints file',
  );

  const agree = page.locator('#agree');
  await agree.waitFor();
  assert.equal(
    await agree.evaluate((el) => getComputedStyle(el).color),
    'rgb(22, 163, 74)',
    'checked box paints tick',
  );

  const twin = page.locator('#agree-twin');
  await twin.waitFor();
  assert.equal(
    await twin.evaluate((el) => getComputedStyle(el).color),
    'rgb(22, 163, 74)',
    'data-state twin paints tick without a checkbox',
  );
}
