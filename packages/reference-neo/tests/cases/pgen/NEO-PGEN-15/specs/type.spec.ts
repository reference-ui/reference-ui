// type.spec.ts — spec for NEO-PGEN-15, the E4 style-props-everywhere case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the family
// probe that stopped assigning, the tsc diagnostic that broke the negative,
// or the unpainted root on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { capped, readPgenWorldTsconfig, typecheckFile } from '../../shared/typecheck.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// One probe per E1 family (special, text, flow, interactive, media, form,
// table), each carrying a token prop plus a css object or array and a
// condition arm. Materialized into a temp dir at spec time because it cannot
// live in the repo: the harness pre-run typecheck resolves @reference-ui/react
// to the stable surface, while this consumer proves the vendored E4.
const POSITIVE = `import type { AProps, DetailsProps, DivProps, ImgProps, InputProps, SpanProps, TableProps } from '@pgen/primitives'

const flow: DivProps = { color: 'brand', css: { marginTop: '4px' }, _hover: { color: 'ink' } }
const text: SpanProps = { color: 'ink', css: [{ color: 'brand' }], '@sm': { color: 'paper' } }
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
const NEGATIVE = `import type { DivProps } from '@pgen/primitives'

const bad: DivProps = { definitelyNotAProp: 'x' }
export { bad }
`;

// Raw E4 types css as an open record, so a bogus key inside css() assigns
// today. This pins the openness deliberately: W4's per-system bake narrows
// css toward the system style object, and flips this probe to a negative.
const OPEN_CSS = `import type { DivProps } from '@pgen/primitives'

const open: DivProps = { css: { definitelyNotAProp: 'x' } }
export { open }
`;

// After sync, every E1 family's probe assigns token props plus css and arms
// against the vendored E4, a bogus key fails with TS2353, the open css record
// still assigns, and the same world paints its brand root.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  assert.equal(c.id, 'NEO-PGEN-15', 'spec runs under its own case id');
  const paths = readPgenWorldTsconfig(c.worldDir);
  const outDir = path.join(c.worldDir, '.reference-ui');
  assert.ok(fs.existsSync(path.join(outDir, 'styled', 'types', 'index.d.ts')), 'sync published styled types');

  const positive = await typecheckFile({ tag: 'pgen-15', worldDir: c.worldDir, paths, file: 'positive.ts', source: POSITIVE });
  assert.equal(
    positive.code,
    0,
    `every family probe assigns against E4:\n${capped(positive.text).join('\n')}`,
  );

  const negative = await typecheckFile({ tag: 'pgen-15', worldDir: c.worldDir, paths, file: 'negative.ts', source: NEGATIVE });
  assert.notEqual(negative.code, 0, 'bogus key is rejected at the props-object position');
  assert.ok(
    negative.text.includes('TS2353'),
    `rejection carries TS2353:\n${capped(negative.text).join('\n')}`,
  );

  const open = await typecheckFile({ tag: 'pgen-15', worldDir: c.worldDir, paths, file: 'open.ts', source: OPEN_CSS });
  assert.equal(
    open.code,
    0,
    `raw-E4 css record stays open until the W4 bake:\n${capped(open.text).join('\n')}`,
  );

  const root = page.locator('#type-root');
  await root.waitFor();
  assert.equal(
    await root.evaluate((el) => getComputedStyle(el).color),
    'rgb(124, 58, 237)',
    'root paints brand text',
  );
}
