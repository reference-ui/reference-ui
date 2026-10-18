// type.spec.ts — spec for NEO-PGEN-22, the per-system narrow case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the token
// position that stopped assigning, the tsc diagnostic that broke a negative,
// or the unpainted root on failure.
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

// System literals assign at the ColorToken position and at the style-props
// color position, StylePropName carries a compiled member while staying
// neither never nor string, a narrowed css object assigns, and a string
// variant assigns at the open per-tag position.
const POSITIVE = `import type { ColorToken, DivProps, StyleProps, StylePropName } from '@reference-ui/react'

const known: ColorToken = 'brand'
const token: StyleProps = { color: 'brand' }
const name: StylePropName = 'color'
type IsNever = [StylePropName] extends [never] ? true : false
const notNever: IsNever = false
type IsString = string extends StylePropName ? true : false
const notString: IsString = false
const cssOk: DivProps = { css: { color: 'brand' } }
const strOk: DivProps = { variant: 'accent' }
export const probes = { known, token, name, notNever, notString, cssOk, strOk }
`;

// 'accent' is a live color leaf of NEO-COND-07's world and unknown here, so
// the per-system ColorToken position rejects it with TS2322 — the proof the
// bake narrowed rather than widened.
const FOREIGN_TOKEN = `import type { ColorToken } from '@reference-ui/react'

const bad: ColorToken = 'accent'
export { bad }
`;

// 'definitelyNotAProp' is outside the compiled union, so the exact
// StylePropName position rejects it with TS2322.
const BOGUS_PROP = `import type { StylePropName } from '@reference-ui/react'

const bad: StylePropName = 'definitelyNotAProp'
export { bad }
`;

// The bound bake narrows css to SystemStyleObject, so a bogus key inside
// the css object fails with TS2353.
const NARROW_CSS = `import type { DivProps } from '@reference-ui/react'

const bad: DivProps = { css: { definitelyNotAProp: 'x' } }
export { bad }
`;

// This world declares no recipes, so the bound bake types the exported
// variant alias as never and a variant selection object fails against it
// with TS2322. Per-tag variant stays open unknown: user-space components
// spread their own open props into it, so precision lives at the alias.
const NEVER_VARIANT = `import type { PrimitiveVariantProp } from '@reference-ui/react'

const bad: PrimitiveVariantProp = { tone: 'accent' }
export { bad }
`;

// After sync, system literals assign against the bound entry while the
// StylePropName union pins exact, a foreign-system token fails with TS2322,
// a bogus prop name fails with TS2322, a bogus css key fails with TS2353, a
// variant selection object fails with TS2322 at the exported alias, and
// the same world paints its brand root.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  assert.equal(c.id, 'NEO-PGEN-22', 'spec runs under its own case id');
  const paths = readWorldTsconfig(c.worldDir);
  const outDir = path.join(c.worldDir, '.reference-ui');
  assert.ok(fs.existsSync(path.join(outDir, 'react', 'react.d.mts')), 'sync published the bound entry');
  assert.ok(fs.existsSync(path.join(outDir, 'styled', 'types', 'index.d.ts')), 'sync published styled types');

  const positive = await typecheckFile({ tag: 'pgen-22', worldDir: c.worldDir, paths, file: 'positive.ts', source: POSITIVE });
  assert.equal(
    positive.code,
    0,
    `system literals assign against the bound entry:\n${capped(positive.text).join('\n')}`,
  );

  const foreign = await typecheckFile({ tag: 'pgen-22', worldDir: c.worldDir, paths, file: 'foreign.ts', source: FOREIGN_TOKEN });
  assert.notEqual(foreign.code, 0, 'foreign-system token is rejected at the ColorToken position');
  assert.ok(
    foreign.text.includes('TS2322'),
    `rejection carries TS2322:\n${capped(foreign.text).join('\n')}`,
  );

  const bogus = await typecheckFile({ tag: 'pgen-22', worldDir: c.worldDir, paths, file: 'bogus.ts', source: BOGUS_PROP });
  assert.notEqual(bogus.code, 0, 'bogus name is rejected at the StylePropName position');
  assert.ok(
    bogus.text.includes('TS2322'),
    `rejection carries TS2322:\n${capped(bogus.text).join('\n')}`,
  );

  const css = await typecheckFile({ tag: 'pgen-22', worldDir: c.worldDir, paths, file: 'css.ts', source: NARROW_CSS });
  assert.notEqual(css.code, 0, 'bogus css key is rejected at the narrowed css position');
  assert.ok(
    css.text.includes('TS2353'),
    `rejection carries TS2353:\n${capped(css.text).join('\n')}`,
  );

  const variant = await typecheckFile({ tag: 'pgen-22', worldDir: c.worldDir, paths, file: 'variant.ts', source: NEVER_VARIANT });
  assert.notEqual(variant.code, 0, 'variant selection object is rejected at the exported variant alias');
  assert.ok(
    variant.text.includes('TS2322'),
    `rejection carries TS2322:\n${capped(variant.text).join('\n')}`,
  );

  const root = page.locator('#type-root');
  await root.waitFor();
  assert.equal(
    await root.evaluate((el) => getComputedStyle(el).color),
    'rgb(124, 58, 237)',
    'root paints brand text',
  );
}
