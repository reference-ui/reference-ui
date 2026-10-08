// type.spec.ts — spec for NEO-PGEN-18, the E4 conditions-plus-responsive case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the arm or
// array that stopped assigning, the tsc diagnostic that broke the negative,
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

// Condition arms, a breakpoint arm, and a responsive array with a null hole
// all assign, and bare sm is absent from the key set at the type level.
// Materialized into a temp dir at spec time because it cannot live in the
// repo: the harness pre-run typecheck resolves @reference-ui/react to the
// stable surface, while this consumer proves the vendored E4.
const POSITIVE = `import type { StyleProps } from '@pgen/primitives'

const arms: StyleProps = { _hover: { color: 'brand' }, '@sm': { color: 'ink' } }
const responsive: StyleProps = { padding: [null, '4r'] }
type HasBareSm = 'sm' extends keyof StyleProps ? true : false
const bareSmAbsent: HasBareSm = false
export const probes = { arms, responsive, bareSmAbsent }
`;

// Bare sm is not a condition key (@sm only, D8), so a bare-sm keyed object
// is rejected with TS2353. Same temp-dir materialization as the positive file.
const NEGATIVE = `import type { StyleProps } from '@pgen/primitives'

const bad: StyleProps = { sm: { color: 'brand' } }
export { bad }
`;

// After sync, condition and breakpoint arms plus null-hole arrays assign
// against the vendored E4 with bare sm absent from the keys, a bare-sm keyed
// object fails with TS2353, and the same world paints its brand root.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  assert.equal(c.id, 'NEO-PGEN-18', 'spec runs under its own case id');
  const paths = readPgenWorldTsconfig(c.worldDir);
  const outDir = path.join(c.worldDir, '.reference-ui');
  assert.ok(fs.existsSync(path.join(outDir, 'styled', 'types', 'index.d.ts')), 'sync published styled types');

  const positive = await typecheckFile({ tag: 'pgen-18', worldDir: c.worldDir, paths, file: 'positive.ts', source: POSITIVE });
  assert.equal(
    positive.code,
    0,
    `arms and responsive arrays assign against E4:\n${capped(positive.text).join('\n')}`,
  );

  const negative = await typecheckFile({ tag: 'pgen-18', worldDir: c.worldDir, paths, file: 'negative.ts', source: NEGATIVE });
  assert.notEqual(negative.code, 0, 'bare-sm keyed object is rejected at the style position');
  assert.ok(
    negative.text.includes('TS2353'),
    `rejection carries TS2353:\n${capped(negative.text).join('\n')}`,
  );

  const root = page.locator('#type-root');
  await root.waitFor();
  assert.equal(
    await root.evaluate((el) => getComputedStyle(el).color),
    'rgb(124, 58, 237)',
    'root paints brand text',
  );
}
