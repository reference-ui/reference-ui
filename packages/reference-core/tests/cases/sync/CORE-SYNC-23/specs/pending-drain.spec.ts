// pending-drain.spec.ts — spec for CORE-SYNC-23: a pending cold tasty failure drains once. Takes
// { case } from the runner, which serves this world unsynced, and copies the world to a temp project with a source that
// is not valid UTF-8, so CSS syncs but the tasty scan fails. It runs sync in-process and drains at once: the failure,
// then nothing. It then spawns `ref sync` on the project and expects exit 1 with the tasty failure line. Emits nothing
// on success; throws naming the drain or the exit that came back wrong. The temp project is removed in a finally.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
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
const FAILURE_LINE = '[ref] sync failed: reference tasty build failed:';
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
    assert.equal(run.status, 1, `ref sync exits 1 on the tasty failure, got ${run.status} (${run.signal}): ${output}`);
    assert.ok(output.includes(FAILURE_LINE), `ref sync prints the tasty failure line, got: ${output}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
