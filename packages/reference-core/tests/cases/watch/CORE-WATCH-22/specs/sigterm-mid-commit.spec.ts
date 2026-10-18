// sigterm-mid-commit.spec.ts — spec for CORE-WATCH-22, a SIGTERM delivered mid-commit. Takes { case } from the runner and
// asserts node-side: a temp world syncs, the brand changes, and a sync is held at the commit's test-only pause point
// (REF_TEST_COMMIT_PAUSE) with its live changes landed. SIGTERM is sent while it is held, then the sync resumes. The sync
// must end by that signal or exit non-zero, release its lock, and leave the folder whole: either the new state or the
// last-good one. Emits nothing on success; throws naming the failed leg on failure.
import assert from 'node:assert/strict';
import { existsSync, rmSync } from 'node:fs';
import type { CoreCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import {
  awaitPaused,
  COMMIT_PAUSE_ENV,
  disposeWorld,
  liveSheetCarries,
  lockOf,
  makeWorld,
  outOf,
  pauseDirOf,
  REBRAND,
  resume,
  runCli,
  setBrand,
  snapshot,
  spawnCli,
} from '../../shared/commit-world.ts';

interface SpecInput {
  page: SpecPage;
  case: CoreCase;
}

function sameFolder(a: Map<string, string>, b: Map<string, string>): boolean {
  return a.size === b.size && [...a].every(([file, hash]) => b.get(file) === hash);
}

export default async function run(_input: SpecInput): Promise<void> {
  const dir = makeWorld();
  const pauseDir = pauseDirOf(dir);
  try {
    const baseline = await runCli(['sync', dir], dir);
    assert.equal(baseline.code, 0, `baseline sync exits 0, got ${baseline.code}: ${baseline.output}`);
    const before = snapshot(outOf(dir));
    setBrand(dir, REBRAND);

    const sync = spawnCli(['sync', dir], dir, { [COMMIT_PAUSE_ENV]: pauseDir });
    assert.ok(await awaitPaused(sync, pauseDir), `the sync paused inside its commit (it exited or never got there): ${sync.output()}`);
    assert.ok(liveSheetCarries(dir, REBRAND), 'the pause stands after the live changes landed: the live sheet already carries the new brand');
    // The commit is synchronous: the signal queues while it is held, and its handler can only run once the commit returns.
    sync.child.kill('SIGTERM');
    resume(sync, pauseDir);
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
