// pending-drain.spec.ts — spec for CORE-SYNC-23: a pending tasty failure is one error and exit 0.
// Takes { case } from the runner, which serves this world unsynced, and copies the world to a temp project
// with a source that is not valid UTF-8, so CSS syncs but the tasty scan fails. It runs sync in-process and drains at
// once: the failure, then nothing. It then spawns `ref sync` on the project and expects exit 0, the coded error once,
// the Errors row, and the stylesheet written. Emits nothing on success; throws naming the drain or exit that came back
// wrong. The temp project is removed in a finally.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CoreCase } from '../../../../shared/cases.ts';
import { flushReferenceBuild } from '../../../../../src/reference/bridge/index.ts';
import { sync } from '../../../../../src/sync/index.ts';

interface SpecInput {
  case: CoreCase;
}

const BIN_PATH = fileURLToPath(new URL('../../../../../bin/ref.ts', import.meta.url));
const CHILD_ENV = { ...process.env, NO_COLOR: '1' };
// Latin-1 é is the byte 0xE9 on its own: not valid UTF-8, so tasty's read fails. CSS reads lossily and syncs clean.
const BROKEN_SOURCE = 'export const broken = "café"\n';
const ERROR_CODE = 'TST-E-SCAN-FAILED';
const SUMMARY_ROW = 'Errors:    1 tasty error';
const SYNC_BUDGET_MS = 90_000;

// A fresh copy of the committed world plus the broken source, with its real path so every call resolves one root.
function brokenWorld(worldDir: string): string {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), 'core-sync-23-')));
  cpSync(worldDir, dir, { recursive: true });
  writeFileSync(path.join(dir, 'src', 'broken.ts'), Buffer.from(BROKEN_SOURCE, 'latin1'));
  return dir;
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  const dir = brokenWorld(c.worldDir);
  try {
    await sync(dir);
    const first = await flushReferenceBuild(dir);
    assert.equal(first?.status, 'failed', `the drain returns the pending failure, got ${JSON.stringify(first)}`);
    const second = await flushReferenceBuild(dir);
    assert.equal(second, undefined, `the second drain returns nothing, got ${JSON.stringify(second)}`);

    const run = spawnSync(process.execPath, [BIN_PATH, 'sync', dir], {
      cwd: dir,
      env: CHILD_ENV,
      encoding: 'utf8',
      timeout: SYNC_BUDGET_MS,
      killSignal: 'SIGKILL',
    });
    const output = `${run.stdout}${run.stderr}`;
    assert.equal(run.status, 0, `ref sync exits 0 on the tasty failure, got ${run.status} (${run.signal}): ${output}`);
    const reports = output.split(ERROR_CODE).length - 1;
    assert.equal(reports, 1, `ref sync prints the tasty error exactly once, got ${reports}: ${output}`);
    assert.ok(output.includes(SUMMARY_ROW), `the summary names the tasty error, got: ${output}`);
    assert.ok(existsSync(path.join(dir, '.reference-ui', 'styled', 'styles.css')), 'the stylesheet is still written');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
