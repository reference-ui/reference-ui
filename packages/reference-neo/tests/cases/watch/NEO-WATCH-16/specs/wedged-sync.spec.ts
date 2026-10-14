// wedged-sync.spec.ts — spec for NEO-WATCH-16, the wedged sync proof. Takes { case } from the runner with the world
// freshly synced, starts the real `ref sync --watch` CLI as a child process, and reads the lines it prints. A config
// whose top-level await never settles pins the one resync pass: a save past the stuck bound must print the stuck line
// and never a success line, and SIGINT must exit within the shutdown bound with exit code 1, the unsettled line, and
// the sync lock released. The world restores in a finally, so no outcome leaves the tree dirty. Emits nothing on
// success; throws naming the failed leg and every line the watch printed.
import assert from 'node:assert/strict';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { flushReferenceBuild } from '../../../../../src/reference/bridge/index.ts';
import { RESYNC_SHUTDOWN_SETTLE_MS, RESYNC_STUCK_MS } from '../../../../../src/lib/watch/scheduler.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

interface Exit {
  code: number | null;
  signal: NodeJS.Signals | null;
}

const BIN_PATH = fileURLToPath(new URL('../../../../../bin/ref.ts', import.meta.url));
const CHILD_ENV = { ...process.env, NO_COLOR: '1' };
// The wedge is a config that never settles. Its evaluation bound (30 s, src/config/evaluate.ts) sits past this spec's
// shutdown window, so the pass is still unsettled at SIGINT. NEO-WATCH-29 covers what the bound then does.
const READY_TEXT = 'ready in';
const STUCK_TEXT = 'in-flight sync stuck for';
const UNSETTLED_TEXT = 'in-flight sync did not settle; exiting';
const SUCCESS_TEXT = 'ref sync';
const WAIT_MS = 60000;
// Slack over each bound for process startup and a loaded machine: the claim is that the exit is bounded, not instant.
const SLACK_MS = 2000;
const WEDGED_CONFIG = [
  "import { defineConfig } from '@reference-ui/neo'",
  'await new Promise(() => {})',
  'export default defineConfig({',
  "  name: 'neo-watch16',",
  "  include: ['theme/**/*.{ts,tsx}'],",
  '})',
  '',
].join('\n');

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The exit record, or undefined when the child is still running after the budget: a watch that ignores its signal
// fails the case instead of hanging the runner.
function exitWithin(exited: Promise<Exit>, ms: number): Promise<Exit | undefined> {
  return Promise.race([exited, sleep(ms).then(() => undefined)]);
}

// Stdout and stderr land in one list in arrival order, so a line never races its neighbour's split. The exit record
// resolves on close, after both streams end, so every line the child printed is in the list before the spec reads it.
function startWatch(worldDir: string): { child: ChildProcess; lines: string[]; exited: Promise<Exit> } {
  const lines: string[] = [];
  const child = spawn(process.execPath, [BIN_PATH, 'sync', '--watch', worldDir], {
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
    stream?.on('end', () => {
      if (partial !== '') lines.push(partial);
    });
  }
  const exited = new Promise<Exit>((resolve) => {
    child.once('close', (code, signal) => resolve({ code, signal }));
  });
  return { child, lines, exited };
}

// Poll until cond holds or the budget burns; the failure names every line the watch printed, so a missing line reads as
// what the watch actually said.
async function waitUntil(cond: () => boolean, label: string, lines: string[]): Promise<void> {
  const deadline = Date.now() + WAIT_MS;
  while (!cond()) {
    assert.ok(Date.now() < deadline, `timed out waiting for ${label}; the watch printed:\n${lines.join('\n')}`);
    await sleep(100);
  }
}

// The restore runs as a one-shot CLI process, so the generated folder is whole again before the case ends.
function restoreWorld(worldDir: string): void {
  const restored = spawnSync(process.execPath, [BIN_PATH, 'sync', worldDir], { env: CHILD_ENV, encoding: 'utf8' });
  if (restored.status !== 0) throw new Error(`restoring the world failed: ${restored.stdout}${restored.stderr}`);
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  const configPath = path.join(c.worldDir, 'ui.config.ts');
  const tokensPath = path.join(c.worldDir, 'theme', 'tokens.ts');
  const lockDir = path.join(c.worldDir, '.reference-ui', 'sync.lock');
  const configSource = fs.readFileSync(configPath, 'utf8');
  const tokensSource = fs.readFileSync(tokensPath, 'utf8');
  // The runner's own sync may leave its cold tasty build in flight; land it before the watcher writes the same folder.
  await flushReferenceBuild(c.worldDir);

  const { child, lines, exited } = startWatch(c.worldDir);
  try {
    await waitUntil(() => lines.some((line) => line.includes(READY_TEXT)), 'the watch boot block', lines);

    // The config save starts the one resync pass, and that pass never settles.
    fs.writeFileSync(configPath, WEDGED_CONFIG);
    // Past the stuck bound, a save finds the pass still in flight: it must report the stall and never sync.
    await sleep(RESYNC_STUCK_MS + SLACK_MS);
    fs.writeFileSync(tokensPath, `${tokensSource}// a save behind the wedged pass\n`);
    await waitUntil(() => lines.some((line) => line.includes(STUCK_TEXT)), 'the stuck line for the save behind the wedged pass', lines);
    assert.ok(
      !lines.some((line) => line.includes(SUCCESS_TEXT)),
      `a wedged pass never prints a success line; the watch printed:\n${lines.join('\n')}`,
    );

    child.kill('SIGINT');
    const exit = await exitWithin(exited, RESYNC_SHUTDOWN_SETTLE_MS + SLACK_MS);
    assert.ok(exit !== undefined, `SIGINT did not exit the wedged watch within its shutdown bound; the watch printed:\n${lines.join('\n')}`);
    assert.equal(exit.code, 1, `SIGINT exits the wedged watch with code 1, got ${exit.code} (${exit.signal})`);
    assert.ok(
      lines.some((line) => line.includes(UNSETTLED_TEXT)),
      `the exit names the sync it gave up; the watch printed:\n${lines.join('\n')}`,
    );
    assert.ok(!fs.existsSync(lockDir), 'the shutdown releases the sync lock');
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGKILL');
      await exited;
    }
    fs.writeFileSync(configPath, configSource);
    fs.writeFileSync(tokensPath, tokensSource);
    restoreWorld(c.worldDir);
  }
}
