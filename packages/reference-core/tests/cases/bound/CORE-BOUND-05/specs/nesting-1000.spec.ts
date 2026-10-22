// nesting-1000.spec.ts — the sync side of CORE-BOUND-05, nested 1,000 levels, just inside the gate.
// It syncs 71 files, one of them nested 1,000 levels, through the spawned bin under a 10 s kill budget. It takes { case }
// from the runner and syncs a temp copy that it owns. Oxc parses src/deep.ts, so the child must end with no signal and exit 0
// inside the budget, and the published stylesheet must carry the blue of the small files and the red of the deep value.
// Emits nothing on success; throws naming the failed leg on failure. The temp copy is removed in a finally.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import type { CoreCase } from '../../../../shared/cases.ts';
import { exitCodeOf } from '../../../../shared/exit-code.ts';
import { BIN_PATH, buildDeepWorld, SYNC_BUDGET_MS } from './deep-world.ts';

interface SpecInput {
  case: CoreCase;
}

const NESTING = 1_000;

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
    const reason = sync.error ? ` (${sync.error.message})` : '';
    assert.equal(
      sync.signal,
      null,
      `ref sync ends with no signal inside ${SYNC_BUDGET_MS} ms, got signal ${sync.signal} after ${elapsed} ms${reason}: ${sync.stderr}`
    );
    assert.equal(
      exitCodeOf(sync.status, sync.signal),
      0,
      `ref sync exits 0 inside ${SYNC_BUDGET_MS} ms, got status ${sync.status} after ${elapsed} ms: ${sync.stderr}`
    );
    const sheet = readFileSync(path.join(dir, '.reference-ui', 'styled', 'styles.css'), 'utf8');
    assert.match(sheet, /color: blue/, 'the stylesheet carries the colour of the 70 small files');
    assert.match(sheet, /color: red/, 'the stylesheet carries the colour of the 1,000-deep value');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
