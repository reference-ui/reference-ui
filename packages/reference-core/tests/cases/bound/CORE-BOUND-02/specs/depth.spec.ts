// depth.spec.ts — spec for CORE-BOUND-02: a tokens() group nested 150 levels fails ref sync by name. It takes { case } from the runner, which
// serves this world unsynced because it fails by design, copies the world to a temp project and spawns the bin's sync
// there under a 10 s budget. The child must exit 1, with no signal, printing the named error with its path and file.
// Emits nothing on success; throws naming the exit, the signal or the missing line. The temp project is removed in a finally.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CoreCase } from '../../../../shared/cases.ts';

interface SpecInput {
  case: CoreCase;
}

const BIN_PATH = fileURLToPath(new URL('../../../../../bin/ref.ts', import.meta.url));
const CHILD_ENV = { ...process.env, NO_COLOR: '1' };
const SYNC_BUDGET_MS = 10_000;
const EXPECTED = `token tree nests deeper than 100 levels at ${['deep', ...Array(100).fill('n')].join('.')} (src/tokens.ts)`;

export default async function run({ case: c }: SpecInput): Promise<void> {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), 'core-bound-02-')));
  try {
    cpSync(c.worldDir, dir, { recursive: true });
    const run = spawnSync(process.execPath, [BIN_PATH, 'sync', dir], {
      cwd: dir,
      env: CHILD_ENV,
      encoding: 'utf8',
      timeout: SYNC_BUDGET_MS,
      killSignal: 'SIGKILL',
    });
    const output = `${run.stdout}${run.stderr}`;
    const reason = run.error ? ` (${run.error.message})` : '';
    assert.equal(run.signal, null, `ref sync ends inside ${SYNC_BUDGET_MS} ms, got signal ${run.signal}${reason}`);
    assert.equal(run.status, 1, `ref sync exits 1, got ${run.status}: ${output}`);
    assert.ok(output.includes(EXPECTED), `ref sync prints "${EXPECTED}", got: ${output}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
