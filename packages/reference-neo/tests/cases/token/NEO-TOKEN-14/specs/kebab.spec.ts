// kebab.spec.ts — spec for NEO-TOKEN-14, the kebab-naming case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the probe
// or sheet line whose kebab name missed on failure.
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

// The sheet must define the kebab names in both color-mode blocks with no
// camelCase ghosts, and both consumption paths must compute the light gray:
// the token path through engine resolution, the hardcoded var() exactly as
// lib's Slider trackBackground authors it.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(
    styles.includes('--colors-ui-progress-track-mix-foreground: var(--colors-gray-950);'),
    'sheet defines the kebab mix-foreground in the light block',
  );
  assert.ok(
    styles.includes('--colors-ui-progress-track-mix-background: #ffffff;'),
    'sheet defines the kebab mix-background in the light block',
  );
  const darkBlock = styles.slice(styles.indexOf('[data-color-mode=dark]'));
  assert.ok(
    darkBlock.includes('--colors-ui-progress-track-mix-foreground: var(--colors-gray-50);'),
    'sheet defines the kebab mix-foreground in the dark block',
  );
  assert.ok(
    !styles.includes('--colors-ui-progress-track-mixForeground'),
    'sheet carries no camelCase mixForeground ghost',
  );
  assert.ok(
    !styles.includes('--colors-ui-progress-track-mixBackground'),
    'sheet carries no camelCase mixBackground ghost',
  );
  assert.ok(
    styles.includes('color: var(--colors-ui-progress-track-mix-foreground);'),
    'a utility consumes the kebab name by var()',
  );

  const token = await colorOf(page, 'token');
  const hardcoded = await colorOf(page, 'hardcoded');
  assert.equal(token, hardcoded, `token path and hardcoded var compute alike, got ${token} vs ${hardcoded}`);
  assert.equal(token, 'rgb(3, 7, 18)', 'both probes resolve to the gray-950 light value');
}
