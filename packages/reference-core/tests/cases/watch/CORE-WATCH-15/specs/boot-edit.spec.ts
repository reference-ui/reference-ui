// boot-edit.spec.ts — spec for CORE-WATCH-15, the boot-window case. Takes { case } from the runner with the world freshly
// synced. It spawns the real `ref sync --watch` CLI with the hold shim in specs/shim, which keeps the watch's first subscribe
// waiting for three seconds, and saves a new brand token inside that hold. The generated sheet must carry the saved brand
// once the watch reports ready. Emits nothing on success; throws naming the missing leg on failure. The child stops and the
// token file restores in a finally, so the tree is byte-clean for the next run.
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
const BOOT_BRAND = '#123456';
const HOLD_MS = '3000';
const WAIT_MS = 90000;
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
    await sleep(20);
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
  const shimState = fs.mkdtempSync(path.join(os.tmpdir(), 'core-watch-15-'));
  const subscribeMark = path.join(shimState, 'subscribe.mark');

  // The runner's own sync may leave its cold tasty build in flight; land it before the watcher writes the same folder.
  await flushReferenceBuild(c.worldDir);
  const { child, lines } = startWatch(c.worldDir, {
    CORE_WATCH_SUBSCRIBE_MARK: subscribeMark,
    CORE_WATCH_SUBSCRIBE_DELAY_MS: HOLD_MS,
    CORE_WATCH_REAL_PARCEL_FROM: REAL_PARCEL_FROM,
  });
  try {
    // The mark appears when the watch reaches its first subscribe, and the hold keeps it there for three seconds.
    await waitUntil(() => fs.existsSync(subscribeMark), 'the watch to reach its first subscribe', lines);
    fs.writeFileSync(tokensPath, originalTokens.replace(BASE_BRAND, BOOT_BRAND));

    await waitUntil(() => lines.some((line) => line.includes(READY_TEXT)), 'the watch boot block', lines);
    assert.match(
      fs.readFileSync(sheetPath, 'utf8'),
      new RegExp(`--colors-brand:\\s*${BOOT_BRAND}`),
      'the watch reports ready with the sheet still on the pre-boot brand: the save made during the boot was lost'
    );
  } finally {
    await stopWatch(child);
    fs.writeFileSync(tokensPath, originalTokens);
    fs.rmSync(shimState, { recursive: true, force: true });
    restoreWorld(c.worldDir);
  }
}
