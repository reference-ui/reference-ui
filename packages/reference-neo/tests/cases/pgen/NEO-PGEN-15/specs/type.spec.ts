// type.spec.ts — spec for NEO-PGEN-15, the bound style-props-everywhere case.
// Takes { page, case } from the runner with the world freshly synced and the
// page already navigated to it. Emits nothing on success; throws naming the
// family probe that stopped assigning, the tsc diagnostic that broke a
// negative, or the unpainted root on failure.
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

// One probe per E1 family (special, text, flow, interactive, media, form,
// table), each carrying a token prop plus a css object and a condition arm.
// Array css is red at this position by the css accommodation (the bound
// PrimitiveCssProp is object-only), so the text probe carries an object.
// Materialized into a temp dir at spec time because it cannot live in the
// repo: the harness pre-run typecheck resolves @reference-ui/react to the
// stable surface, while this consumer proves this world's bound entry.
const POSITIVE = `import type { AProps, DetailsProps, DivProps, ImgProps, InputProps, SpanProps, TableProps } from '@reference-ui/react'

const flow: DivProps = { color: 'brand', css: { marginTop: '4px' }, _hover: { color: 'ink' } }
const text: SpanProps = { color: 'ink', css: { color: 'brand' }, '@sm': { color: 'paper' } }
const form: InputProps = { backgroundColor: 'paper', _focus: { color: 'brand' } }
const table: TableProps = { width: '100%', _first: { color: 'ink' } }
const media: ImgProps = { opacity: '1', _hover: { opacity: '0.8' } }
const interactive: DetailsProps = { color: 'brand', css: { padding: '8px' } }
const special: AProps = { color: 'ink', _visited: { color: 'brand' } }
export const probes = { flow, text, form, table, media, interactive, special }
`;

// 'definitelyNotAProp' is not a style prop, so the props-object position
// rejects it with TS2353 (TYPE-08 precedent). Same temp-dir materialization
// as the positive file.
const NEGATIVE = `import type { DivProps } from '@reference-ui/react'

const bad: DivProps = { definitelyNotAProp: 'x' }
export { bad }
`;

// The bound bake narrows css to the system style object, so the bogus key
// inside css that assigned against raw E4 now fails with TS2353 — the W4
// flip of the pinned-open probe.
const NARROW_CSS = `import type { DivProps } from '@reference-ui/react'

const bad: DivProps = { css: { definitelyNotAProp: 'x' } }
export { bad }
`;

// After sync, every E1 family's probe assigns token props plus css and arms
// against the bound entry, a bogus key fails with TS2353 at the
// props-object position and inside css, and the same world paints its brand
// root.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  assert.equal(c.id, 'NEO-PGEN-15', 'spec runs under its own case id');
  const paths = readWorldTsconfig(c.worldDir);
  const outDir = path.join(c.worldDir, '.reference-ui');
  assert.ok(fs.existsSync(path.join(outDir, 'react', 'react.d.mts')), 'sync published the bound entry');
  assert.ok(fs.existsSync(path.join(outDir, 'styled', 'types', 'index.d.ts')), 'sync published styled types');

  const positive = await typecheckFile({ tag: 'pgen-15', worldDir: c.worldDir, paths, file: 'positive.ts', source: POSITIVE });
  assert.equal(
    positive.code,
    0,
    `every family probe assigns against the bound entry:\n${capped(positive.text).join('\n')}`,
  );

  const negative = await typecheckFile({ tag: 'pgen-15', worldDir: c.worldDir, paths, file: 'negative.ts', source: NEGATIVE });
  assert.notEqual(negative.code, 0, 'bogus key is rejected at the props-object position');
  assert.ok(
    negative.text.includes('TS2353'),
    `rejection carries TS2353:\n${capped(negative.text).join('\n')}`,
  );

  const css = await typecheckFile({ tag: 'pgen-15', worldDir: c.worldDir, paths, file: 'css.ts', source: NARROW_CSS });
  assert.notEqual(css.code, 0, 'bogus css key is rejected at the narrowed css position');
  assert.ok(
    css.text.includes('TS2353'),
    `rejection carries TS2353:\n${capped(css.text).join('\n')}`,
  );

  const root = page.locator('#type-root');
  await root.waitFor();
  assert.equal(
    await root.evaluate((el) => getComputedStyle(el).color),
    'rgb(124, 58, 237)',
    'root paints brand text',
  );
}
