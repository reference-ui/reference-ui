// registry.spec.ts — spec for NEO-TOKEN-10, the font-registry case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// missing registry var, the unmerged weight subtree, or the mispainted probe.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

interface EvaluatedTokens {
  tokens: { fontWeights: unknown };
}

// The runner synced the Inter-sans world before serving: the host-derived
// weight subtree rides the evaluated spec, the tokens layer carries the
// family var plus every registry weight var, and the macro probe paints the
// Inter stack at the registry normal weight.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');

  const evaluated = JSON.parse(
    fs.readFileSync(path.join(outDir, 'system/evaluated-system.json'), 'utf8'),
  ) as EvaluatedTokens;
  assert.deepEqual(
    evaluated.tokens.fontWeights,
    {
      sans: { thin: { value: '200' }, normal: { value: '400' }, bold: { value: '700' } },
    },
    'host derives the fontWeights subtree into the evaluated spec',
  );

  const tokensOpen = styles.indexOf('@layer tokens {');
  assert.ok(tokensOpen !== -1, 'sheet carries @layer tokens');
  const utilitiesOpen = styles.indexOf('@layer utilities {', tokensOpen);
  const tokensBody = utilitiesOpen === -1 ? styles.slice(tokensOpen) : styles.slice(tokensOpen, utilitiesOpen);
  assert.ok(tokensBody.includes('--fonts-sans:'), 'tokens layer carries the family var');
  for (const [leaf, value] of [
    ['thin', '200'],
    ['normal', '400'],
    ['bold', '700'],
  ]) {
    assert.ok(
      tokensBody.includes(`--font-weights-sans-${leaf}: ${value}`),
      `tokens layer carries the ${leaf} weight var`,
    );
  }
  assert.ok(
    styles.includes('font-family: var(--fonts-sans);'),
    'sheet carries the macro family expansion',
  );

  const fontProbe = page.locator('#font');
  await fontProbe.waitFor();
  const family = await fontProbe.evaluate((el) => getComputedStyle(el).fontFamily);
  assert.ok(family.includes('Inter'), `macro paints the Inter stack, got ${family}`);
  assert.equal(
    await fontProbe.evaluate((el) => getComputedStyle(el).fontWeight),
    '400',
    'macro paints the registry normal weight',
  );
}
