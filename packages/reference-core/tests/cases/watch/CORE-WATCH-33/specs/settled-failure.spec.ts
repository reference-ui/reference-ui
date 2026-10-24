// settled-failure.spec.ts — CORE-WATCH-33: the watch reports a settled tasty failure and survives. Takes { case } from the runner, which serves this world unsynced, and copies it to a temp project with a
// source that is not valid UTF-8, so CSS syncs but the tasty scan fails. Leg one drains in-process after the failure has
// settled; leg two spawns the real `ref sync --watch`. Emits nothing on success; throws naming the line or the exit that
// came back wrong. The watch stops and the temp project is removed in a finally.
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { cpSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CoreCase } from '../../../../shared/cases.ts';
import { drainFoldedLanding } from '../../../../../src/cli/watch.ts';
import { flushReferenceBuild, isReferenceBuildPending } from '../../../../../src/reference/bridge/index.ts';
import { sync } from '../../../../../src/sync/index.ts';

interface SpecInput {
  case: CoreCase;
}

const BIN_PATH = fileURLToPath(new URL('../../../../../bin/ref.ts', import.meta.url));
const CHILD_ENV = { ...process.env, NO_COLOR: '1' };
// Latin-1 é is the byte 0xE9 on its own: not valid UTF-8, so tasty's read fails. CSS reads lossily and syncs clean.
const BROKEN_SOURCE = 'export const broken = "café"\n';
const FAILURE_TEXT = '[ref] watch error: reference tasty build failed:';
const READY_TEXT = 'ready in';
const SETTLE_MS = 60_000;
const WAIT_MS = 90_000;
const STOP_MS = 15_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// A fresh copy of the committed world plus the broken source, with its real path so every call resolves one root.
function brokenWorld(worldDir: string): string {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), 'core-watch-33-')));
  cpSync(worldDir, dir, { recursive: true });
  writeFileSync(path.join(dir, 'src', 'broken.ts'), Buffer.from(BROKEN_SOURCE, 'latin1'));
  return dir;
}

async function waitUntilSettled(dir: string): Promise<void> {
  const deadline = Date.now() + SETTLE_MS;
  while (isReferenceBuildPending(dir)) {
    assert.ok(Date.now() < deadline, `the cold tasty build settles inside ${SETTLE_MS} ms`);
    await sleep(50);
  }
}

// Leg one: the failure has settled before the drain, and the watch's drain still says it, once.
async function drainSettledFailure(dir: string): Promise<void> {
  await sync(dir);
  await waitUntilSettled(dir);
  const said: string[] = [];
  const first = await drainFoldedLanding(dir, (line) => said.push(line));
  assert.equal(first?.status, 'failed', `the drain returns the settled failure, got ${JSON.stringify(first)}`);
  assert.equal(said.length, 1, `the drain says the failure once, said: ${JSON.stringify(said)}`);
  assert.ok(said[0]?.startsWith(FAILURE_TEXT), `the drain says the tasty failure line, said: ${said[0]}`);
  const again: string[] = [];
  const second = await drainFoldedLanding(dir, (line) => again.push(line));
  assert.equal(second, undefined, `the second drain returns nothing, got ${JSON.stringify(second)}`);
  assert.deepEqual(again, [], 'the second drain says nothing');
}

// Stdout and stderr land in one list in arrival order, so a line never races its neighbour's split.
function startWatch(dir: string): { child: ChildProcess; lines: string[] } {
  const lines: string[] = [];
  const child = spawn(process.execPath, [BIN_PATH, 'sync', '--watch', dir], {
    env: CHILD_ENV,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  for (const stream of [child.stdout, child.stderr]) {
    let partial = '';
    stream?.setEncoding('utf8');
    stream?.on('data', (chunk: string) => {
      const parts = (partial + chunk).split('\n');
      partial = parts.pop() ?? '';
      lines.push(...parts);
    });
  }
  return { child, lines };
}

async function waitUntil(cond: () => boolean, label: string, lines: string[]): Promise<void> {
  const deadline = Date.now() + WAIT_MS;
  while (!cond()) {
    assert.ok(Date.now() < deadline, `timed out waiting for ${label}; the watch printed:\n${lines.join('\n')}`);
    await sleep(100);
  }
}

// SIGTERM is the watch's graceful stop; SIGKILL only if it hangs.
function stopWatch(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return new Promise((resolve) => {
    const force = setTimeout(() => child.kill('SIGKILL'), STOP_MS);
    child.once('exit', () => {
      clearTimeout(force);
      resolve();
    });
    child.kill('SIGTERM');
  });
}

// Leg two: the real watch reports the failure at boot, prints its boot block anyway, and is still running afterwards.
async function watchSurvivesFailure(dir: string): Promise<void> {
  const { child, lines } = startWatch(dir);
  try {
    await waitUntil(
      () => lines.some((line) => line.includes(FAILURE_TEXT)) && lines.some((line) => line.includes(READY_TEXT)),
      'the tasty failure line and the watch boot block',
      lines
    );
    await sleep(500);
    assert.equal(child.exitCode, null, `the watch keeps running after the failure, exited ${child.exitCode}:\n${lines.join('\n')}`);
    assert.equal(child.signalCode, null, 'the watch is not killed by a signal');
  } finally {
    await stopWatch(child);
  }
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  const dir = brokenWorld(c.worldDir);
  try {
    await drainSettledFailure(dir);
    await flushReferenceBuild(dir);
    await watchSurvivesFailure(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
