// type.spec.ts — spec for NEO-PGEN-16, the E4 token-unions case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the token
// position that stopped assigning, the tsc diagnostic that broke the negative,
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

// A known literal assigns at the ColorToken position and at E4's color
// position, the category-prefixed spelling assigns where P-prim-1 allows,
// and the open string hatch assigns too — documented, not smuggled (see
// TYP-STRICT-04). Materialized into a temp dir at spec time because it cannot
// live in the repo: the harness pre-run typecheck resolves @reference-ui/react
// to the stable surface, while this consumer proves the vendored E4.
const POSITIVE = `import type { StyleProps } from '@pgen/primitives'
import type { ColorToken } from '@reference-ui/styled'

const known: ColorToken = 'brand'
const token: StyleProps = { color: 'brand' }
const prefixed: StyleProps = { color: 'colors.brand' }
const hatch: StyleProps = { color: 'nope' }
export const probes = { known, token, prefixed, hatch }
`;

// 42 is not a string-domain token value, so the narrow color position rejects
// it with TS2322 — the proof the union is real and not an unknown hatch.
// Same temp-dir materialization as the positive file.
const NEGATIVE = `import type { StyleProps } from '@pgen/primitives'

const bad: StyleProps = { color: 42 }
export { bad }
`;

// After sync, known and prefixed token literals assign at E4's color
// position with the string hatch documented open, a mistyped value fails
// with TS2322, and the same world paints its brand root.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  assert.equal(c.id, 'NEO-PGEN-16', 'spec runs under its own case id');
  const paths = readPgenWorldTsconfig(c.worldDir);
  const outDir = path.join(c.worldDir, '.reference-ui');
  assert.ok(fs.existsSync(path.join(outDir, 'styled', 'types', 'index.d.ts')), 'sync published styled types');

  const positive = await typecheckFile({ tag: 'pgen-16', worldDir: c.worldDir, paths, file: 'positive.ts', source: POSITIVE });
  assert.equal(
    positive.code,
    0,
    `token literals assign at the color position:\n${capped(positive.text).join('\n')}`,
  );

  const negative = await typecheckFile({ tag: 'pgen-16', worldDir: c.worldDir, paths, file: 'negative.ts', source: NEGATIVE });
  assert.notEqual(negative.code, 0, 'mistyped token value is rejected at the color position');
  assert.ok(
    negative.text.includes('TS2322'),
    `rejection carries TS2322:\n${capped(negative.text).join('\n')}`,
  );

  const root = page.locator('#type-root');
  await root.waitFor();
  assert.equal(
    await root.evaluate((el) => getComputedStyle(el).color),
    'rgb(124, 58, 237)',
    'root paints brand text',
  );
}
