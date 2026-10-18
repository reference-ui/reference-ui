// dropped-events.spec.ts — spec for CORE-WATCH-14, the dropped-batch case. Takes { case } from the runner with the world
// freshly synced. It spawns the real `ref sync --watch` CLI with the loader shim in specs/shim, which drops one event
// batch as parcel's dropped-buffer error. A save inside that batch must still reach the generated sheet through the
// watch's re-scan. Emits nothing on success; throws naming the missing leg on failure. The child stops and the token
// file restores in a finally, so the tree is byte-clean for the next run.
import assert from 'node:assert/strict';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CoreCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { flushReferenceBuild } from '../../../../../src/reference/bridge/index.ts';

interface SpecInput {
  page: SpecPage;
  case: CoreCase;
}

const BIN_PATH = fileURLToPath(new URL('../../../../../bin/ref.ts', import.meta.url));
const SHIM_DIR = fileURLToPath(new URL('./shim/', import.meta.url));
const REAL_PARCEL_FROM = path.resolve(path.dirname(BIN_PATH), '..', 'package.json');
const CHILD_ENV = { ...process.env, NO_COLOR: '1' };
const READY_TEXT = 'ready in';
const BASE_BRAND = '#7c3aed';
const SAVED_BRAND = '#0e5c3f';
const WAIT_MS = 60000;
const STOP_MS = 15000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Stdout and stderr land in one list in arrival order, so a line never races its neighbour's split.
function startWatch(worldDir: string, extraEnv: Record<string, string>): { child: ChildProcess; lines: string[] } {
  const lines: string[] = [];
  const child = spawn(process.execPath, ['--import', path.join(SHIM_DIR, 'register.mjs'), BIN_PATH, 'sync', '--watch', worldDir], {
    env: { ...CHILD_ENV, ...extraEnv },
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

// Poll until cond holds or the budget burns; the failure names every line the watch printed.
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

// The restore runs as a one-shot CLI process, so no watch or warm refresh lane is left running when the case ends.
function restoreWorld(worldDir: string): void {
  const restored = spawnSync(process.execPath, [BIN_PATH, 'sync', worldDir], { env: CHILD_ENV, encoding: 'utf8' });
  if (restored.status !== 0) throw new Error(`restoring the world failed: ${restored.stdout}${restored.stderr}`);
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  const tokensPath = path.join(c.worldDir, 'theme', 'tokens.ts');
  const sheetPath = path.join(c.worldDir, '.reference-ui', 'styled', 'styles.css');
  const originalTokens = fs.readFileSync(tokensPath, 'utf8');
  const shimState = fs.mkdtempSync(path.join(os.tmpdir(), 'core-watch-14-'));
  const dropFlag = path.join(shimState, 'drop.flag');
  const dropLog = path.join(shimState, 'dropped.log');

  // The runner's own sync may leave its cold tasty build in flight; land it before the watcher writes the same folder.
  await flushReferenceBuild(c.worldDir);
  const { child, lines } = startWatch(c.worldDir, {
    CORE_WATCH_DROP_FLAG: dropFlag,
    CORE_WATCH_DROP_LOG: dropLog,
    CORE_WATCH_REAL_PARCEL_FROM: REAL_PARCEL_FROM,
  });
  try {
    await waitUntil(() => lines.some((line) => line.includes(READY_TEXT)), 'the watch boot block', lines);

    // The next non-empty event batch is dropped, so the save below is lost to the watcher's event stream.
    fs.writeFileSync(dropFlag, '1');
    fs.writeFileSync(tokensPath, originalTokens.replace(BASE_BRAND, SAVED_BRAND));
    await waitUntil(() => fs.existsSync(dropLog), 'the shim to drop the batch that carries the save', lines);
    fs.rmSync(dropFlag, { force: true });

    // Only a re-scan can bring the save to the sheet: no further event arrives for it.
    await waitUntil(
      () => fs.readFileSync(sheetPath, 'utf8').includes(`--colors-brand: ${SAVED_BRAND}`),
      'the watch to re-scan after the dropped batch and paint the saved brand',
      lines
    );
  } finally {
    await stopWatch(child);
    fs.rmSync(dropFlag, { force: true });
    fs.writeFileSync(tokensPath, originalTokens);
    fs.rmSync(shimState, { recursive: true, force: true });
    restoreWorld(c.worldDir);
  }
}
