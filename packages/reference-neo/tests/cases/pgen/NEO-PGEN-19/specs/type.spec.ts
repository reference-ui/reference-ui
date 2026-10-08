// type.spec.ts — spec for NEO-PGEN-19, the E4 refs-plus-elements case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the host
// type that stopped resolving, the tsc diagnostic that broke a negative, or
// the unpainted root on failure.
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

// Per-tag host types resolve including the caption and menu overrides, the
// PrimitiveProps generic takes its tag argument, and each component's ref
// position names its own host. Materialized into a temp dir at spec time
// because it cannot live in the repo: the harness pre-run typecheck resolves
// @reference-ui/react to the stable surface, while this consumer proves E4.
const POSITIVE = `import { Div, Input } from '@pgen/primitives'
import type { PrimitiveElement, PrimitiveProps, PrimitiveTag } from '@pgen/primitives'

const host: PrimitiveElement<'div'> = null as unknown as HTMLDivElement
const caption: PrimitiveElement<'caption'> = null as unknown as HTMLTableCaptionElement
const menu: PrimitiveElement<'menu'> = null as unknown as HTMLMenuElement
const generic: PrimitiveProps<'input'> = { color: 'brand' }
const tag: PrimitiveTag = 'div'
type DivRef = Parameters<typeof Div>[0]['ref']
type InputRef = Parameters<typeof Input>[0]['ref']
export const probes = { host, caption, menu, generic, tag }
export type { DivRef, InputRef }
`;

// PrimitiveProps without its tag argument is rejected with TS2314 (TYPE-07
// precedent). Same temp-dir materialization as the positive file.
const NEGATIVE_ARITY = `import type { PrimitiveProps } from '@pgen/primitives'

const bare: PrimitiveProps = {}
export { bare }
`;

// A div host ref is not an input host ref, so assigning across hosts is
// rejected with TS2322. The direction matters: lib.dom types input as a
// structural subtype of div, so only the div-into-input assignment fails.
const NEGATIVE_HOST = `import { Input } from '@pgen/primitives'
import type * as React from 'react'

type InputRef = Parameters<typeof Input>[0]['ref']
const wrong: InputRef = null as unknown as React.Ref<HTMLDivElement>
export { wrong }
`;

// After sync, per-tag hosts resolve with overrides and the generic takes its
// argument, the bare generic fails with TS2314, the cross-host ref fails with
// TS2322, and the same world paints its brand root.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  assert.equal(c.id, 'NEO-PGEN-19', 'spec runs under its own case id');
  const paths = readPgenWorldTsconfig(c.worldDir);
  const outDir = path.join(c.worldDir, '.reference-ui');
  assert.ok(fs.existsSync(path.join(outDir, 'styled', 'types', 'index.d.ts')), 'sync published styled types');

  const positive = await typecheckFile({ tag: 'pgen-19', worldDir: c.worldDir, paths, file: 'positive.ts', source: POSITIVE });
  assert.equal(
    positive.code,
    0,
    `hosts and the generic resolve against E4:\n${capped(positive.text).join('\n')}`,
  );

  const arity = await typecheckFile({ tag: 'pgen-19', worldDir: c.worldDir, paths, file: 'negative-arity.ts', source: NEGATIVE_ARITY });
  assert.notEqual(arity.code, 0, 'bare PrimitiveProps is rejected at the annotation');
  assert.ok(
    arity.text.includes('TS2314'),
    `rejection carries TS2314:\n${capped(arity.text).join('\n')}`,
  );

  const host = await typecheckFile({ tag: 'pgen-19', worldDir: c.worldDir, paths, file: 'negative-host.ts', source: NEGATIVE_HOST });
  assert.notEqual(host.code, 0, 'cross-host ref is rejected at the ref position');
  assert.ok(
    host.text.includes('TS2322'),
    `rejection carries TS2322:\n${capped(host.text).join('\n')}`,
  );

  const root = page.locator('#type-root');
  await root.waitFor();
  assert.equal(
    await root.evaluate((el) => getComputedStyle(el).color),
    'rgb(124, 58, 237)',
    'root paints brand text',
  );
}
