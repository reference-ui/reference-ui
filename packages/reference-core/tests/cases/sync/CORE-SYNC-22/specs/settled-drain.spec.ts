// settled-drain.spec.ts — spec for CORE-SYNC-22: a settled cold tasty failure drains once. Takes
// { case } from the runner, which serves this world unsynced, and copies the world to a temp project with a source that
// is not valid UTF-8, so CSS syncs but the tasty scan fails. It runs sync in-process, waits until the cold build is no
// longer pending, then drains twice: the failure once, then nothing. Emits nothing on success; throws naming the drain
// that came back wrong. The temp project is removed in a finally.
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { CoreCase } from '../../../../shared/cases.ts';
import { flushReferenceBuild, isReferenceBuildPending } from '../../../../../src/reference/bridge/index.ts';
import { sync } from '../../../../../src/sync/index.ts';

interface SpecInput {
  case: CoreCase;
}

// Latin-1 é is the byte 0xE9 on its own: not valid UTF-8, so tasty's read fails. CSS reads lossily and syncs clean.
const BROKEN_SOURCE = 'export const broken = "café"\n';
const SETTLE_MS = 60_000;

// A fresh copy of the committed world plus the broken source, with its real path so every call resolves one root.
function brokenWorld(worldDir: string): string {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), 'core-sync-22-')));
  cpSync(worldDir, dir, { recursive: true });
  writeFileSync(path.join(dir, 'src', 'broken.ts'), Buffer.from(BROKEN_SOURCE, 'latin1'));
  return dir;
}

async function waitUntilSettled(dir: string): Promise<void> {
  const deadline = Date.now() + SETTLE_MS;
  while (isReferenceBuildPending(dir)) {
    assert.ok(Date.now() < deadline, `the cold tasty build settles inside ${SETTLE_MS} ms`);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  const dir = brokenWorld(c.worldDir);
  try {
    await sync(dir);
    await waitUntilSettled(dir);
    const first = await flushReferenceBuild(dir);
    assert.equal(first?.status, 'failed', `the first drain returns the settled failure, got ${JSON.stringify(first)}`);
    const second = await flushReferenceBuild(dir);
    assert.equal(second, undefined, `the second drain returns nothing, got ${JSON.stringify(second)}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
