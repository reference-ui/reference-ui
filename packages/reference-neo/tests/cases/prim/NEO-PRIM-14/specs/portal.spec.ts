// portal.spec.ts — spec for NEO-PRIM-14, the portal island case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the lost
// detachment, the missing stamp, or the probe that resolves the wrong leaf.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

async function attr(page: SpecPage, id: string, name: 'data-layer' | 'data-color-mode'): Promise<string | null> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  if (name === 'data-layer') {
    return node.evaluate((el) => el.getAttribute('data-layer'));
  }
  return node.evaluate((el) => el.getAttribute('data-color-mode'));
}

async function colorOf(page: SpecPage, id: string): Promise<string> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  return node.evaluate((el) => getComputedStyle(el).color);
}

// The portaled island detaches from the light host's DOM yet keeps dark
// resolution: the child inherits dark through island context, stamps the
// Neo attribute, and paints the dark leaf while the host paints light. No
// Panda-chrome spelling survives anywhere.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('[data-color-mode=dark]'), 'sheet carries the dark island');
  assert.ok(styles.includes('--colors-island: #1e293b'), 'dark island carries the dark leaf');
  assert.ok(!styles.includes('data-panda-theme'), 'sheet stamps no panda theme attribute');

  const host = page.locator('#portal-host');
  await host.waitFor();
  assert.equal(
    await host.evaluate((el) => el.parentElement?.tagName),
    'BODY',
    'portal host attaches at body, outside the light host DOM',
  );
  assert.equal(
    await host.evaluate((el) => el.closest('#light-host') != null),
    false,
    'portal host sits outside the light host subtree',
  );

  assert.equal(
    await attr(page, 'portal-island', 'data-layer'),
    'neo-prim14',
    'portal island stamps data-layer',
  );
  assert.equal(
    await attr(page, 'portal-island', 'data-color-mode'),
    'dark',
    'portal island stamps data-color-mode="dark"',
  );
  assert.equal(
    await attr(page, 'portal-child', 'data-color-mode'),
    'dark',
    'portal child inherits dark with no dark DOM ancestor',
  );

  assert.equal(await colorOf(page, 'host-token'), 'rgb(219, 234, 254)', 'host probe paints light');
  assert.equal(await colorOf(page, 'in-tree-token'), 'rgb(30, 41, 59)', 'in-tree island paints dark');
  assert.equal(await colorOf(page, 'portal-child'), 'rgb(30, 41, 59)', 'portal child paints dark');

  assert.equal(
    await page.locator('html').evaluate((el) => el.ownerDocument.querySelectorAll('[data-panda-theme]').length),
    0,
    'no data-panda-theme attribute exists in the document',
  );
}
