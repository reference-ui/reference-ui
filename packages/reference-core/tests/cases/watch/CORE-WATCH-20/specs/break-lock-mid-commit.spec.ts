// break-lock-mid-commit.spec.ts — spec for CORE-WATCH-20, --break-lock over a holder held mid-commit. Takes { case } from
// the runner and asserts node-side: a holder sync is held at the commit's test-only pause point (REF_TEST_COMMIT_PAUSE),
// a breaker sync takes the lock and is held at its own, then the holder resumes first and the breaker second. The breaker
// must exit 0, the displaced holder must stop cleanly with the lock message, and the folder must equal a clean rebuild.
// Emits nothing on success; throws naming the leg.
import assert from 'node:assert/strict';
import { existsSync, rmSync } from 'node:fs';
import type { CoreCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import {
  awaitPaused,
  COMMIT_PAUSE_ENV,
  disposeWorld,
  lockOf,
  makeWorld,
  outOf,
  pauseDirOf,
  plantStale,
  REBRAND,
  resume,
  runCli,
  setBrand,
  snapshot,
  spawnCli,
  stageOf,
} from '../../shared/commit-world.ts';

interface SpecInput {
  page: SpecPage;
  case: CoreCase;
}

// A few stale files: the commit retires them after the pause point, so the resumed holder meets its ownership check there.
const STALE_FILES = 3;

export default async function run(_input: SpecInput): Promise<void> {
  const dir = makeWorld();
  const pauseDir = pauseDirOf(dir);
  const armed = { [COMMIT_PAUSE_ENV]: pauseDir };
  try {
    const baseline = await runCli(['sync', dir], dir);
    assert.equal(baseline.code, 0, `baseline sync exits 0, got ${baseline.code}: ${baseline.output}`);
    plantStale(dir, STALE_FILES);
    setBrand(dir, REBRAND);

    const holder = spawnCli(['sync', dir], dir, armed);
    assert.ok(await awaitPaused(holder, pauseDir), `the holder paused inside its commit (it exited or never got there): ${holder.output()}`);
    const breaker = spawnCli(['sync', '--break-lock', dir], dir, armed);
    assert.ok(await awaitPaused(breaker, pauseDir), `the breaker paused inside its own commit (it exited or never got there): ${breaker.output()}`);

    resume(holder, pauseDir);
    const holderRun = await holder.done;
    resume(breaker, pauseDir);
    const breakerRun = await breaker.done;

    assert.equal(breakerRun.code, 0, `the breaker sync exits 0, got ${breakerRun.code}: ${breakerRun.output}`);
    assert.notEqual(holderRun.code, 0, 'the displaced holder exits non-zero');
    assert.match(holderRun.output, /another sync took the lock/, `the displaced holder says it lost the lock: ${holderRun.output}`);
    assert.equal(existsSync(stageOf(dir)), false, 'no stage is left behind');
    assert.equal(existsSync(lockOf(dir)), false, 'the lock is released');

    const settled = snapshot(outOf(dir));
    rmSync(outOf(dir), { recursive: true, force: true });
    const clean = await runCli(['sync', dir], dir);
    assert.equal(clean.code, 0, `the clean rebuild exits 0, got ${clean.code}: ${clean.output}`);
    assert.deepEqual(settled, snapshot(outOf(dir)), 'the folder after the race equals a clean rebuild: no torn file');
  } finally {
    disposeWorld(dir);
  }
}
