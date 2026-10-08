// visibility.spec.ts — spec for NEO-LAYER-06, the token-visibility case.
// Takes { page, case } from the runner with the world freshly synced and the
// page already navigated to it. Emits nothing on success; throws naming the
// missing token var, the unreferencing rule, or the unpainted probe.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The world declared one brand token feeding a card recipe base and a plain
// color utility. The sheet carries the brand var in the tokens layer with
// both the recipe rule and the utility rule referencing it; both probes
// paint brand computed.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const tokensOpen = styles.indexOf('@layer tokens {');
  assert.ok(tokensOpen !== -1, 'sheet carries @layer tokens');
  const recipesOpen = styles.indexOf('@layer recipes {', tokensOpen);
  assert.ok(recipesOpen !== -1, 'sheet carries @layer recipes');
  const tokens = styles.slice(tokensOpen, recipesOpen);
  assert.ok(
    tokens.includes('--colors-brand: #7c3aed'),
    'tokens layer carries the brand var',
  );
  const utilitiesOpen = styles.indexOf('@layer utilities {', recipesOpen);
  assert.ok(utilitiesOpen !== -1, 'sheet carries @layer utilities');
  const recipes = styles.slice(recipesOpen, utilitiesOpen);
  const utilities = styles.slice(utilitiesOpen);
  assert.ok(
    recipes.includes('card__base') && recipes.includes('color: var(--colors-brand)'),
    'recipe base references the token var',
  );
  assert.ok(
    utilities.includes('color: var(--colors-brand)'),
    'utility references the token var',
  );

  for (const id of ['#recipeprobe', '#utilprobe']) {
    const probe = page.locator(id);
    await probe.waitFor();
    assert.equal(
      await probe.evaluate((el) => getComputedStyle(el).color),
      'rgb(124, 58, 237)',
      `${id} paints brand from the one token`,
    );
  }
}
