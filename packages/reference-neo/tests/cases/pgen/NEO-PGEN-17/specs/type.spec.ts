// type.spec.ts — spec for NEO-PGEN-17, the E4 recipe-variants case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// selection shape that stopped assigning or the unpainted root on failure.
// Raw E4 types variant as unknown, so tonight this case proves assignment
// only; the wrong-axis invalidation waits on the W4 per-system bake.
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

// An optional-axis selection object and a compound row subset both assign to
// variant today. Materialized into a temp dir at spec time because it cannot
// live in the repo: the harness pre-run typecheck resolves @reference-ui/react
// to the stable surface, while this consumer proves the vendored E4.
const POSITIVE = `import type { DivProps } from '@pgen/primitives'

const axis: DivProps = { variant: { tone: 'accent' } }
const compound: DivProps = { variant: { tone: 'accent', size: 'lg' }, color: 'brand' }
export const probes = { axis, compound }
`;

// Raw E4 types variant as unknown, so a wrong axis value assigns today. This
// pins the openness deliberately: W4's per-system bake narrows variant to the
// system recipe unions, and flips this probe to the wrong-axis negative.
const OPEN_VARIANT = `import type { DivProps } from '@pgen/primitives'

const wrongAxis: DivProps = { variant: { tone: 'not-a-tone' } }
export { wrongAxis }
`;

// After sync, selection objects assign to variant against the vendored E4,
// the wrong-axis value still assigns through the unknown hatch, and the same
// world paints its brand root. No red leg tonight: the invalidation needs the
// bound entry's narrowed variant, which is W4's surface, not E4's.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  assert.equal(c.id, 'NEO-PGEN-17', 'spec runs under its own case id');
  const paths = readPgenWorldTsconfig(c.worldDir);
  const outDir = path.join(c.worldDir, '.reference-ui');
  assert.ok(fs.existsSync(path.join(outDir, 'styled', 'types', 'index.d.ts')), 'sync published styled types');

  const positive = await typecheckFile({ tag: 'pgen-17', worldDir: c.worldDir, paths, file: 'positive.ts', source: POSITIVE });
  assert.equal(
    positive.code,
    0,
    `selection objects assign to variant:\n${capped(positive.text).join('\n')}`,
  );

  const open = await typecheckFile({ tag: 'pgen-17', worldDir: c.worldDir, paths, file: 'open.ts', source: OPEN_VARIANT });
  assert.equal(
    open.code,
    0,
    `raw-E4 variant stays open until the W4 bake:\n${capped(open.text).join('\n')}`,
  );

  const root = page.locator('#type-root');
  await root.waitFor();
  assert.equal(
    await root.evaluate((el) => getComputedStyle(el).color),
    'rgb(124, 58, 237)',
    'root paints brand text',
  );
}
