// colormode.spec.ts — spec for NEO-PRIM-07, the color-mode islands case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// stamp, island, or the depth that failed to repaint on failure.
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

// Two islands, three depths, two probe kinds. The token probe follows the
// ink var through the islands and flips back in the nested light one; the
// brand probe carries a _dark paper override that paints under any dark
// ancestor, including through the nested light island. Stamps are asserted
// on the DOM, repaints as computed colours — the sheet checks only name rules.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes(':root, [data-color-mode=light]'), 'sheet carries the light island');
  assert.ok(styles.includes('[data-color-mode=dark]'), 'sheet carries the dark island');
  assert.ok(styles.includes('--colors-ink: #111111'), 'light island carries the light ink');
  assert.ok(styles.includes('--colors-ink: #f5f5f5'), 'dark island carries the dark ink');
  assert.ok(
    styles.includes('[data-color-mode=dark] .neo-prim7__dark\\:c_paper'),
    'sheet scopes the dark utility under the dark island',
  );
  assert.ok(!styles.includes('data-panda-theme'), 'sheet stamps no panda theme attribute');
  assert.ok(!styles.includes('[data-theme='), 'sheet stamps no bare data-theme attribute');

  const surface = page.locator('#surface');
  await surface.waitFor();
  assert.equal(
    await surface.evaluate((el) => el.getAttribute('data-color-mode')),
    null,
    'surface without colorMode stamps nothing',
  );

  const darkIsland = page.locator('#dark-island');
  await darkIsland.waitFor();
  assert.equal(
    await darkIsland.evaluate((el) => el.getAttribute('data-color-mode')),
    'dark',
    'dark island stamps data-color-mode="dark"',
  );

  const lightIsland = page.locator('#light-island');
  await lightIsland.waitFor();
  assert.equal(
    await lightIsland.evaluate((el) => el.getAttribute('data-color-mode')),
    'light',
    'nested island stamps data-color-mode="light"',
  );

  assert.equal(await colorOf(page, 'ink-light'), 'rgb(17, 17, 17)', 'surface ink paints light');
  assert.equal(
    await colorOf(page, 'brand-light'),
    'rgb(124, 58, 237)',
    'surface brand keeps its base outside the dark island',
  );
  assert.equal(await colorOf(page, 'ink-dark'), 'rgb(245, 245, 245)', 'dark island ink repaints');
  assert.equal(
    await colorOf(page, 'brand-dark'),
    'rgb(255, 255, 255)',
    'dark island _dark override repaints over the base',
  );
  assert.equal(
    await colorOf(page, 'ink-nested'),
    'rgb(17, 17, 17)',
    'nested light island ink flips back',
  );
  assert.equal(
    await colorOf(page, 'brand-nested'),
    'rgb(255, 255, 255)',
    'nested light island keeps the dark override: _dark answers to any dark ancestor',
  );
}
