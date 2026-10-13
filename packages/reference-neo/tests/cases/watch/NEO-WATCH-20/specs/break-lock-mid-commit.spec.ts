// break-lock-mid-commit.spec.ts — spec for NEO-WATCH-20, --break-lock over a holder frozen mid-commit. Takes { case } from
// the runner and asserts node-side: a holder sync is frozen inside its commit, a breaker sync takes the lock and is
// frozen inside its own commit, then both resume. The breaker must exit 0, the displaced holder must stop cleanly
// with the lock message, and the folder must equal a clean rebuild. Emits nothing on success; throws naming the leg.
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
  requestStamp,
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

export default async function run(_input: SpecInput): Promise<void> {
  const dir = makeWorld();
  try {
    const baseline = await runCli(['sync', dir], dir);
    assert.equal(baseline.code, 0, `baseline sync exits 0, got ${baseline.code}: ${baseline.output}`);
    plantStale(dir, 1000);
    setBrand(dir, REBRAND);

    const holder = spawnCli(['sync', dir], dir);
    assert.ok(await freezeInCommit(holder, stageOf(dir)), 'the holder froze inside its commit (inconclusive: it finished first)');
    // The holder's request already sits in the shared stage: the breaker's probe waits for a newer one of its own.
    const holderRequest = requestStamp(stageOf(dir));
    const breaker = spawnCli(['sync', '--break-lock', dir], dir);
    assert.ok(
      await freezeInCommit(breaker, stageOf(dir), holderRequest),
      'the breaker froze inside its own commit (inconclusive)'
    );

    holder.child.kill('SIGCONT');
    const holderRun = await holder.done;
    breaker.child.kill('SIGCONT');
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
