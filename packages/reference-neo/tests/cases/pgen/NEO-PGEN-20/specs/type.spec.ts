// type.spec.ts — spec for NEO-PGEN-20, the E4 forbidden-surface case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. This case is pure invalidation: it emits nothing on
// success and throws naming the forbidden member that started resolving, the
// tsc diagnostic that went missing, or the unpainted root on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { readShelfDts } from '../../shared/parity.ts';
import { capped, readPgenWorldTsconfig, typecheckFile } from '../../shared/typecheck.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The pattern pack, the factory, and slot recipes are none of them E4
// members, so importing any fails with TS2305. Materialized into a temp dir
// at spec time because it cannot live in the repo: the harness pre-run
// typecheck resolves @reference-ui/react to the stable surface.
const NEGATIVE_IMPORTS = `import { Box, Flex, Grid, styled, sva } from '@pgen/primitives'

export const absent = { Box, Flex, Grid, styled, sva }
`;

// Polymorphic as is refused on every primitive, so the key is rejected with
// TS2353. Same temp-dir materialization as the imports file.
const NEGATIVE_AS = `import type { DivProps } from '@pgen/primitives'

const bad: DivProps = { as: 'span' }
export { bad }
`;

// After sync, every forbidden import fails with TS2305, the as prop fails
// with TS2353, the E4 text carries no panda import, and the same world
// paints its brand root.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  assert.equal(c.id, 'NEO-PGEN-20', 'spec runs under its own case id');
  const paths = readPgenWorldTsconfig(c.worldDir);
  const outDir = path.join(c.worldDir, '.reference-ui');
  assert.ok(fs.existsSync(path.join(outDir, 'styled', 'types', 'index.d.ts')), 'sync published styled types');

  const imports = await typecheckFile({ tag: 'pgen-20', worldDir: c.worldDir, paths, file: 'negative-imports.ts', source: NEGATIVE_IMPORTS });
  assert.notEqual(imports.code, 0, 'forbidden members are rejected at the import');
  assert.ok(
    imports.text.includes('TS2305'),
    `rejection carries TS2305:\n${capped(imports.text).join('\n')}`,
  );

  const asProp = await typecheckFile({ tag: 'pgen-20', worldDir: c.worldDir, paths, file: 'negative-as.ts', source: NEGATIVE_AS });
  assert.notEqual(asProp.code, 0, 'polymorphic as is rejected at the props position');
  assert.ok(
    asProp.text.includes('TS2353'),
    `rejection carries TS2353:\n${capped(asProp.text).join('\n')}`,
  );

  const dts = readShelfDts();
  assert.ok(!dts.includes('@pandacss'), 'E4 carries no panda import');
  assert.ok(!dts.toLowerCase().includes('panda'), 'E4 carries no panda reference at all');

  const root = page.locator('#type-root');
  await root.waitFor();
  assert.equal(
    await root.evaluate((el) => getComputedStyle(el).color),
    'rgb(124, 58, 237)',
    'root paints brand text',
  );
}
