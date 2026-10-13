// commit-failure-rollback.spec.ts — spec for NEO-WATCH-19, a commit that fails partway. Takes { case } from the runner
// and asserts node-side: a fresh temp world syncs, its generated styled/ folder goes read-only, the brand changes so
// the commit has live files to replace, and the failing sync must exit non-zero with every live file byte-identical
// to before the run. Emits nothing on success; throws naming the failed leg on failure.
import assert from 'node:assert/strict';
import { chmodSync } from 'node:fs';
import { join } from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { disposeWorld, makeWorld, outOf, REBRAND, runCli, setBrand, snapshot } from '../../shared/commit-world.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

export default async function run(_input: SpecInput): Promise<void> {
  // chmod does not stop root from writing: a root run would sync cleanly and prove nothing.
  assert.notEqual(process.getuid?.(), 0, 'NEO-WATCH-19 needs a non-root user: chmod 555 does not stop root from writing');
  const dir = makeWorld();
  const styled = join(outOf(dir), 'styled');
  try {
    const baseline = await runCli(['sync', dir], dir);
    assert.equal(baseline.code, 0, `baseline sync exits 0, got ${baseline.code}: ${baseline.output}`);
    const before = snapshot(outOf(dir));
    setBrand(dir, REBRAND);
    chmodSync(styled, 0o555);
    const failed = await runCli(['sync', dir], dir).finally(() => chmodSync(styled, 0o755));
    assert.notEqual(failed.code, 0, `a sync whose commit cannot write styled/ exits non-zero, got ${failed.code}`);
    assert.deepEqual(snapshot(outOf(dir)), before, 'the failed commit leaves every live file byte-identical to before');
  } finally {
    disposeWorld(dir);
  }
}
