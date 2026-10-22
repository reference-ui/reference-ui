// nesting-2000.spec.ts — the refusal side of CORE-BOUND-05, nested 2,000 levels.
// It syncs 71 files, one of them nested 2,000 levels, through the spawned bin under a 10 s kill budget. It takes { case }
// from the runner and syncs a temp copy that it owns. The nesting gate refuses src/deep.ts before Oxc parses it, so the child
// must end with no signal and exit 1 inside the budget, and its output must name ATM-E-PARSE at src/deep.ts:3:1 and the 1024
// limit. Emits nothing on success; throws naming the failed leg on failure. The temp copy is removed in a finally.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import type { CoreCase } from '../../../../shared/cases.ts';
import { exitCodeOf } from '../../../../shared/exit-code.ts';
import { BIN_PATH, buildDeepWorld, SYNC_BUDGET_MS } from './deep-world.ts';

interface SpecInput {
  case: CoreCase;
}

const NESTING = 2_000;

export default async function run(_input: SpecInput): Promise<void> {
  const dir = buildDeepWorld(NESTING);
  try {
    const started = Date.now();
    const sync = spawnSync(process.execPath, [BIN_PATH, 'sync', dir], {
      cwd: dir,
      encoding: 'utf8',
      timeout: SYNC_BUDGET_MS,
      killSignal: 'SIGKILL',
    });
    const elapsed = Date.now() - started;
    const output = `${sync.stdout}${sync.stderr}`;
    assert.equal(
      sync.error,
      undefined,
      `ref sync finishes inside ${SYNC_BUDGET_MS} ms, got ${sync.error?.message} after ${elapsed} ms`
    );
    assert.equal(
      sync.signal,
      null,
      `ref sync ends with no signal inside ${SYNC_BUDGET_MS} ms, got signal ${sync.signal} after ${elapsed} ms: ${output}`
    );
    assert.equal(
      exitCodeOf(sync.status, sync.signal),
      1,
      `the refused sync exits 1 inside ${SYNC_BUDGET_MS} ms, got status ${sync.status} after ${elapsed} ms: ${output}`
    );
    assert.match(output, /ATM-E-PARSE/, `the refusal names ATM-E-PARSE: ${output}`);
    assert.match(output, /src\/deep\.ts:3:1/, `the refusal is located at src/deep.ts:3:1: ${output}`);
    assert.match(output, /1024/, `the refusal names the 1024 limit: ${output}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
