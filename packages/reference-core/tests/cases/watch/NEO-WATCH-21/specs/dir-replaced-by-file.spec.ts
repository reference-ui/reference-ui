// dir-replaced-by-file.spec.ts — spec for NEO-WATCH-21, a generated dir replaced by a file. Takes { case } from the
// runner and asserts node-side: a temp world syncs, its styled/ directory is replaced by a plain file, the brand
// changes, and the next two syncs must both exit 0, leave styled/ a directory again, and carry the new brand.
// Emits nothing on success; throws naming the failed leg on failure.
import assert from 'node:assert/strict';
import { readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { disposeWorld, makeWorld, outOf, REBRAND, runCli, setBrand } from '../../shared/commit-world.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

export default async function run(_input: SpecInput): Promise<void> {
  const dir = makeWorld();
  try {
    const baseline = await runCli(['sync', dir], dir);
    assert.equal(baseline.code, 0, `baseline sync exits 0, got ${baseline.code}: ${baseline.output}`);

    const styled = join(outOf(dir), 'styled');
    rmSync(styled, { recursive: true, force: true });
    writeFileSync(styled, 'not a directory\n');
    setBrand(dir, REBRAND);

    const first = await runCli(['sync', dir], dir);
    assert.equal(first.code, 0, `a sync over a file where styled/ belongs exits 0, got ${first.code}: ${first.output}`);
    const second = await runCli(['sync', dir], dir);
    assert.equal(second.code, 0, `the next sync still exits 0, got ${second.code}: ${second.output}`);

    assert.ok(statSync(styled).isDirectory(), 'styled/ is a directory again');
    assert.match(
      readFileSync(join(styled, 'styles.css'), 'utf8'),
      /--colors-brand:\s*#0e5c3f/i,
      'the rebuilt styled/styles.css carries the new brand'
    );
  } finally {
    disposeWorld(dir);
  }
}
