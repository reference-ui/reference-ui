// foreign.spec.ts — spec for NEO-PRIM-12, the foreign react-dom case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// bundled React copy, the unpainted style prop, or the unstamped attr.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The generated entry imports react externally and carries no bundled copy,
// so a consumer rendering through its own react-dom shares one dispatcher.
// The foreign-rendered Div paints, stamps data-layer, and commits content.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const bundle = fs.readFileSync(path.join(outDir, 'react/react.mjs'), 'utf8');
  assert.ok(/from\s*['"]react['"]/.test(bundle), 'entry imports react externally');
  assert.ok(/from\s*['"]react-dom\/client['"]/.test(bundle), 'entry imports react-dom/client externally');
  assert.ok(
    !bundle.includes('ReactCurrentDispatcher'),
    'entry carries no bundled React copy',
  );
  assert.ok(
    !bundle.includes('react.production'),
    'entry pins no production build path',
  );

  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes('.neo-prim__c_brand'), 'sheet carries the brand utility');
  assert.ok(styles.includes('.neo-prim__p_sm'), 'sheet carries the spacing utility');

  const prim = page.locator('#prim');
  await prim.waitFor();
  assert.equal(
    await prim.evaluate((el) => el.textContent),
    'prim',
    'foreign root commits content (no invalid hook call)',
  );
  const color = await prim.evaluate((el) => getComputedStyle(el).color);
  assert.equal(color, 'rgb(124, 58, 237)', `brand paints the text, got ${color}`);
  const padding = await prim.evaluate((el) => getComputedStyle(el).paddingTop);
  assert.equal(padding, '8px', `spacing paints the padding, got ${padding}`);
  const layer = await prim.evaluate((el) => el.getAttribute('data-layer'));
  assert.equal(layer, 'neo-prim', `data-layer carries the system name, got ${layer}`);
}
