// packages.spec.ts — spec for NEO-LAYER-02, the two-system package case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// unwrapped package, the losing utility, or the unscoped portable var.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

interface PortableSystemFile {
  cssChunks: { css: string }[];
}

// The runner synced this two-system world before serving: the adopted
// upstream token nests inside the downstream package, the downstream
// utility beats the upstream-fed recipe by layer rank, and the portable
// chunk scopes its tokens behind [data-layer]. The sheet carries the
// package wrap with the recipe rule in recipes and the utility later in
// utilities; the mixed node paints ink while the recipe-only and adopted
// nodes paint brass; the stamped probe resolves the portable var and the
// stranger resolves nothing.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(
    styles.includes('@layer neo-layer2 {'),
    'sheet wraps the two-system build in the downstream package layer',
  );
  assert.ok(
    styles.includes('@layer reset, global, base, tokens, recipes, utilities;'),
    'package carries the six-layer order statement',
  );
  assert.ok(
    styles.includes('--colors-brass: #b58900'),
    'adopted upstream token nests inside the package tokens layer',
  );
  const recipesOpen = styles.indexOf('@layer recipes {');
  assert.ok(recipesOpen >= 0, 'recipes layer prints');
  assert.ok(
    styles.includes('.neo-layer2__card__base'),
    'upstream-fed recipe rule prints',
  );
  const utilitiesOpen = styles.indexOf('@layer utilities {');
  assert.ok(utilitiesOpen > recipesOpen, 'utilities layer prints after recipes');
  assert.ok(
    styles.slice(utilitiesOpen).includes('.neo-layer2__c_ink'),
    'downstream utility prints in the utilities layer',
  );

  const mixed = page.locator('#mixed');
  await mixed.waitFor();
  const mixedCls = await mixed.evaluate((el) => el.getAttribute('class'));
  assert.equal(
    mixedCls,
    'neo-layer2__card__base neo-layer2__c_ink',
    `mixed carries recipe plus utility, got ${mixedCls}`,
  );
  const mixedColor = await mixed.evaluate((el) => getComputedStyle(el).color);
  assert.equal(mixedColor, 'rgb(17, 17, 17)', `downstream utility beats the recipe, got ${mixedColor}`);

  const recipeonly = page.locator('#recipeonly');
  await recipeonly.waitFor();
  const recipeColor = await recipeonly.evaluate((el) => getComputedStyle(el).color);
  assert.equal(recipeColor, 'rgb(181, 137, 0)', `upstream-fed recipe paints brass, got ${recipeColor}`);

  const up = page.locator('#up');
  await up.waitFor();
  const upColor = await up.evaluate((el) => getComputedStyle(el).color);
  assert.equal(upColor, 'rgb(181, 137, 0)', `adopted upstream token paints, got ${upColor}`);

  const baseSystemRaw = fs.readFileSync(path.join(outDir, 'system/baseSystem.mjs'), 'utf8');
  const baseSystem = JSON.parse(baseSystemRaw.slice(baseSystemRaw.indexOf('{'))) as PortableSystemFile;
  const chunk = baseSystem.cssChunks[0]?.css ?? '';
  assert.ok(
    chunk.includes('[data-layer="neo-layer2"]'),
    'portable chunk scopes tokens behind the system data-layer',
  );

  const frame = page.locator('#portable');
  await frame.waitFor();
  const played = await frame.evaluate((el) => {
    const inner = (el as HTMLIFrameElement).contentDocument;
    if (!inner) throw new Error('portable frame has no document');
    const probe = inner.getElementById('iplayer');
    if (!probe) throw new Error('portable frame has no stamped probe');
    return inner.defaultView?.getComputedStyle(probe).getPropertyValue('--colors-brass').trim() ?? 'no view';
  });
  assert.equal(played, '#b58900', `stamped probe resolves the portable var, got ${played}`);

  const strayed = await frame.evaluate((el) => {
    const inner = (el as HTMLIFrameElement).contentDocument;
    if (!inner) throw new Error('portable frame has no document');
    const probe = inner.getElementById('istranger');
    if (!probe) throw new Error('portable frame has no stranger probe');
    return inner.defaultView?.getComputedStyle(probe).getPropertyValue('--colors-brass').trim() ?? 'no view';
  });
  assert.equal(strayed, '', `stranger data-layer resolves nothing, got ${strayed}`);
}
