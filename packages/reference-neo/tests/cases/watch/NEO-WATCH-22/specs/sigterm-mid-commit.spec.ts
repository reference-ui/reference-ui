// sigterm-mid-commit.spec.ts — spec for NEO-WATCH-22, a SIGTERM delivered mid-commit. Takes { case } from the runner and
// asserts node-side: a temp world syncs, stale files keep the next commit busy, the brand changes, and a sync is frozen
// inside its commit while SIGTERM is queued for it. The sync must end by that signal or exit non-zero, release its
// lock, and leave the folder whole: either the new state or the last-good one. Emits nothing on success; throws naming
// the failed leg on failure.
import assert from 'node:assert/strict';
import { existsSync, rmSync } from 'node:fs';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import {
  disposeWorld,
  freezeInCommit,
  lockOf,
  makeWorld,
  outOf,
  plantStale,
  REBRAND,
  runCli,
  setBrand,
  snapshot,
  spawnCli,
  stageOf,
} from '../../shared/commit-world.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

function sameFolder(a: Map<string, string>, b: Map<string, string>): boolean {
  return a.size === b.size && [...a].every(([file, hash]) => b.get(file) === hash);
}

export default async function run(_input: SpecInput): Promise<void> {
  const dir = makeWorld();
  try {
    const baseline = await runCli(['sync', dir], dir);
    assert.equal(baseline.code, 0, `baseline sync exits 0, got ${baseline.code}: ${baseline.output}`);
    plantStale(dir, 1000);
    const before = snapshot(outOf(dir));
    setBrand(dir, REBRAND);

    const sync = spawnCli(['sync', dir], dir);
    assert.ok(await freezeInCommit(sync, stageOf(dir)), 'the sync froze inside its commit (inconclusive: it finished first)');
    sync.child.kill('SIGTERM');
    sync.child.kill('SIGCONT');
    const result = await sync.done;

    assert.ok(
      result.signal === 'SIGTERM' || result.code !== 0,
      `a SIGTERM mid-commit ends the sync by the signal or a non-zero exit, got code ${result.code} signal ${result.signal}: ${result.output}`
    );
    assert.equal(existsSync(lockOf(dir)), false, 'the stop releases the sync lock');

    const after = snapshot(outOf(dir));
    rmSync(outOf(dir), { recursive: true, force: true });
    const fresh = await runCli(['sync', dir], dir);
    assert.equal(fresh.code, 0, `the clean rebuild exits 0, got ${fresh.code}: ${fresh.output}`);
    assert.ok(
      sameFolder(after, snapshot(outOf(dir))) || sameFolder(after, before),
      'the folder is whole after the stop: the commit finished or rolled back, never torn'
    );
  } finally {
    disposeWorld(dir);
  }
}
