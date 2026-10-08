// type.spec.ts — spec for NEO-PGEN-17, the bound recipe-variants case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the alias
// or call position that stopped proving, the tsc diagnostic that broke a
// negative, or the unpainted root on failure. Per-tag variant stays open
// unknown by user-space law, so precision lives at the exported alias and at
// recipe calls; this case proves both, never DivProps.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { capped, typecheckFile } from '../../shared/typecheck.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

interface WorldTsconfig {
  compilerOptions?: Record<string, unknown>;
}

// The committed world tsconfig is the single source of truth for the
// mapping: @reference-ui/react at this world's bound react.d.mts (TYPE-01
// pattern, never the vendored E4) plus @reference-ui/styled at the synced
// types. Every consumer below is materialized into a temp dir at spec time
// so the harness pre-run typecheck, which resolves the react specifier to
// the stable surface, never sees them.
function readWorldTsconfig(worldDir: string): Record<string, string[]> {
  const raw = fs.readFileSync(path.join(worldDir, 'tsconfig.json'), 'utf8');
  const parsed = JSON.parse(raw) as WorldTsconfig;
  const compilerOptions = parsed.compilerOptions ?? {};
  const paths = compilerOptions['paths'] as Record<string, string[]> | undefined;
  assert.ok(paths && typeof paths === 'object', 'world tsconfig.json carries a paths map');
  const react = paths['@reference-ui/react'];
  assert.ok(
    Array.isArray(react) && react.some((p) => p.endsWith('react/react.d.mts')),
    `world tsconfig maps @reference-ui/react at the bound react.d.mts, got ${JSON.stringify(react)}`,
  );
  const styled = paths['@reference-ui/styled'];
  assert.ok(
    Array.isArray(styled) && styled.some((p) => p.endsWith('styled/types/index.d.ts')),
    `world tsconfig maps @reference-ui/styled at the synced styled types, got ${JSON.stringify(styled)}`,
  );
  return paths;
}

// One button recipe definition shared by every call leg: the inferred call
// parameter is RecipeVariantProps over the tone axis, so valid selections
// assign and bad ones fail at the call.
const BUTTON_DEF = `import { recipe } from '@reference-ui/react'

const button = recipe({
  className: 'button',
  base: { display: 'inline-flex' },
  variants: { tone: { accent: { color: 'brand' }, muted: { color: 'paper' } } },
  defaultVariants: { tone: 'muted' },
})
`;

// The world's tone recipe fragment mints ToneVariantProps, so the exported
// alias carries the tone axis and a valid selection plus a valid recipe
// call both assign here. Materialized into a temp dir at spec time because
// it cannot live in the repo: the harness pre-run typecheck resolves
// @reference-ui/react to the stable surface, while this consumer proves
// this world's bound entry.
const POSITIVE = `import type { PrimitiveVariantProp } from '@reference-ui/react'
${BUTTON_DEF}
const good: PrimitiveVariantProp = { tone: 'accent' }
const cls: string = button({ tone: 'accent' })
export const probes = { good, cls }
`;

// A wrong axis value fails against the exported alias with TS2322: the tone
// union the world's recipe minted rejects the bad literal.
const NEG_ALIAS = `import type { PrimitiveVariantProp } from '@reference-ui/react'

const bad: PrimitiveVariantProp = { tone: 'not-a-tone' }
export { bad }
`;

// A variant object nested under the call fails against the inferred
// RecipeVariantProps parameter (the REPORT relocation shape): the call takes
// a flat selection, so the unknown key is excess with TS2353.
const NEG_CALL_NESTED = `${BUTTON_DEF}
const cls: string = button({ variant: { tone: 'not-a-tone' } })
export { cls }
`;

// A bad axis value at the flat call position fails with TS2322: the
// inferred tone union rejects the literal. Companion to the nested shape —
// this leg discriminates the narrow inference from the wide fallback.
const NEG_CALL_VALUE = `${BUTTON_DEF}
const cls: string = button({ tone: 'not-a-tone' })
export { cls }
`;

// After sync, a valid selection assigns at the exported alias and a valid
// recipe call assigns through the inferred variants, a wrong axis value
// fails with TS2322 at the alias, a nested variant object fails with TS2353
// at the call, a bad axis value fails with TS2322 at the call, and the same
// world paints its brand root.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  assert.equal(c.id, 'NEO-PGEN-17', 'spec runs under its own case id');
  const paths = readWorldTsconfig(c.worldDir);
  const outDir = path.join(c.worldDir, '.reference-ui');
  assert.ok(fs.existsSync(path.join(outDir, 'react', 'react.d.mts')), 'sync published the bound entry');
  assert.ok(fs.existsSync(path.join(outDir, 'styled', 'types', 'index.d.ts')), 'sync published styled types');

  const positive = await typecheckFile({ tag: 'pgen-17', worldDir: c.worldDir, paths, file: 'positive.ts', source: POSITIVE });
  assert.equal(
    positive.code,
    0,
    `valid selections assign at the alias and the call:\n${capped(positive.text).join('\n')}`,
  );

  const alias = await typecheckFile({ tag: 'pgen-17', worldDir: c.worldDir, paths, file: 'alias.ts', source: NEG_ALIAS });
  assert.notEqual(alias.code, 0, 'wrong axis value is rejected at the exported variant alias');
  assert.ok(
    alias.text.includes('TS2322'),
    `rejection carries TS2322:\n${capped(alias.text).join('\n')}`,
  );

  const nested = await typecheckFile({ tag: 'pgen-17', worldDir: c.worldDir, paths, file: 'nested.ts', source: NEG_CALL_NESTED });
  assert.notEqual(nested.code, 0, 'nested variant object is rejected at the recipe call');
  assert.ok(
    nested.text.includes('TS2353'),
    `rejection carries TS2353:\n${capped(nested.text).join('\n')}`,
  );

  const value = await typecheckFile({ tag: 'pgen-17', worldDir: c.worldDir, paths, file: 'value.ts', source: NEG_CALL_VALUE });
  assert.notEqual(value.code, 0, 'bad axis value is rejected at the recipe call');
  assert.ok(
    value.text.includes('TS2322'),
    `rejection carries TS2322:\n${capped(value.text).join('\n')}`,
  );

  const root = page.locator('#type-root');
  await root.waitFor();
  assert.equal(
    await root.evaluate((el) => getComputedStyle(el).color),
    'rgb(124, 58, 237)',
    'root paints brand text',
  );
}
