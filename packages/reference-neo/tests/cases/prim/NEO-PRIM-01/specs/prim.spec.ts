// prim.spec.ts — spec for NEO-PRIM-01, the native primitive case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// generated entry, the unpainted style prop, or the unstamped attr on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The generated react entry bundles every tag plus the bound css()/recipe()
// over external React; the rendered Div paints its style props, passes its DOM
// prop through, keeps styling keys off the element, and stamps data-layer.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  assert.ok(
    fs.existsSync(path.join(outDir, 'react/react.mjs')),
    'synced folder carries react/react.mjs',
  );
  assert.ok(
    fs.existsSync(path.join(outDir, 'react/react.d.mts')),
    'synced folder carries react/react.d.mts',
  );

  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes('.neo-prim__c_brand'), 'sheet carries the brand utility');
  assert.ok(styles.includes('.neo-prim__p_sm'), 'sheet carries the spacing utility');
  const utilityCount = styles.match(/\.neo-prim__/g)?.length ?? 0;
  assert.equal(utilityCount, 2, `sheet carries exactly the wanted utilities, got ${utilityCount}`);

  const prim = page.locator('#prim');
  await prim.waitFor();
  const color = await prim.evaluate((el) => getComputedStyle(el).color);
  assert.equal(color, 'rgb(124, 58, 237)', `brand paints the text, got ${color}`);
  const padding = await prim.evaluate((el) => getComputedStyle(el).paddingTop);
  assert.equal(padding, '8px', `spacing paints the padding, got ${padding}`);

  const className = await prim.evaluate((el) => el.getAttribute('class'));
  assert.ok(className?.includes('ref-div'), `marker class names the tag, got ${className}`);
  assert.ok(
    className?.includes('neo-prim__c_brand'),
    `resolved classes land on the element, got ${className}`,
  );
  const layer = await prim.evaluate((el) => el.getAttribute('data-layer'));
  assert.equal(layer, 'neo-prim', `data-layer carries the system name, got ${layer}`);
  assert.equal(
    await prim.evaluate((el) => el.getAttribute('color')),
    null,
    'style props stay off the element',
  );
  assert.equal(
    await prim.evaluate((el) => el.getAttribute('p')),
    null,
    'style shorthands stay off the element',
  );
}
