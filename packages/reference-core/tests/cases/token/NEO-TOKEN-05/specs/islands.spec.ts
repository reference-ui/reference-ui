// islands.spec.ts — spec for NEO-TOKEN-05, the colour-mode islands case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// island or the unpainted mode on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

async function colorOf(page: SpecPage, id: string): Promise<string> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  return node.evaluate((el) => getComputedStyle(el).color);
}

// One light/dark token, two scopes. The sheet carries both island selectors
// with the brand var in each; flipping data-color-mode on html repaints the
// top probe, while the nested island keeps its own mode until flipped itself.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes(':root, [data-color-mode=light]'), 'sheet carries the light island');
  assert.ok(styles.includes('[data-color-mode=dark]'), 'sheet carries the dark island');
  assert.ok(styles.includes('--colors-brand: #111111'), 'light island carries the light brand');
  assert.ok(styles.includes('--colors-brand: #f5f5f5'), 'dark island carries the dark brand');
  assert.ok(!styles.includes('data-panda-theme'), 'sheet stamps no panda theme attribute');
  assert.ok(!styles.includes('[data-theme='), 'sheet stamps no bare data-theme attribute');

  const html = page.locator('html');
  const island = page.locator('#island');

  assert.equal(await colorOf(page, 'top'), 'rgb(17, 17, 17)', 'top paints light by default');
  assert.equal(
    await colorOf(page, 'nested'),
    'rgb(245, 245, 245)',
    'nested island paints dark while top is light',
  );

  await html.evaluate((el) => el.setAttribute('data-color-mode', 'dark'));
  assert.equal(await colorOf(page, 'top'), 'rgb(245, 245, 245)', 'flipping html to dark repaints top');
  assert.equal(
    await colorOf(page, 'nested'),
    'rgb(245, 245, 245)',
    'nested stays dark under dark html',
  );

  await html.evaluate((el) => el.setAttribute('data-color-mode', 'light'));
  assert.equal(await colorOf(page, 'top'), 'rgb(17, 17, 17)', 'flipping html to light repaints top');
  assert.equal(
    await colorOf(page, 'nested'),
    'rgb(245, 245, 245)',
    'nested island keeps dark under light html',
  );

  await island.evaluate((el) => el.setAttribute('data-color-mode', 'light'));
  assert.equal(
    await colorOf(page, 'nested'),
    'rgb(17, 17, 17)',
    'flipping the nested island to light repaints nested',
  );
  assert.equal(await colorOf(page, 'top'), 'rgb(17, 17, 17)', 'top stays light');
}
