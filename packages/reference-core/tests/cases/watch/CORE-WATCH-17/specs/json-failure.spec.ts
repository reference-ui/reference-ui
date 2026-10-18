// json-failure.spec.ts — spec for CORE-WATCH-17, the failed resync under --json proof. Takes { case } from the runner
// with the world freshly synced, starts the real `ref sync --watch --json` CLI as a child process, and reads its stdout
// and stderr apart. Stdout must carry only diagnostics arrays, and a save that breaks the tokens fragment must add one
// array per failed sync event, a single error row holding the failure, while the human line rides stderr. The watch
// stops on SIGINT with exit code 0, and the fragment and the generated folder are restored in a finally. Emits nothing
// on success; throws naming the failed leg and what the watch printed.
import assert from 'node:assert/strict';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CoreCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { flushReferenceBuild } from '../../../../../src/reference/bridge/index.ts';

interface SpecInput {
  page: SpecPage;
  case: CoreCase;
}

interface Streams {
  child: ChildProcess;
  stdout: string;
  stderr: string;
  exited: Promise<number | null>;
}

interface Row {
  severity?: unknown;
  message?: unknown;
}

const BIN_PATH = fileURLToPath(new URL('../../../../../bin/ref.ts', import.meta.url));
const CHILD_ENV = { ...process.env, NO_COLOR: '1' };
const BOOM = 'json-boom';
const BROKEN_TOKENS = ["import { tokens } from '@reference-ui/core'", `throw new Error('${BOOM}')`, ''].join('\n');
const WAIT_MS = 60000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The exit code, or undefined when the child is still running after the budget, so a watch that ignores SIGINT fails
// the case instead of hanging the runner.
function exitWithin(exited: Promise<number | null>, ms: number): Promise<number | null | undefined> {
  return Promise.race([exited, sleep(ms).then(() => undefined)]);
}

// Each stream is kept whole: stdout is the machine channel, stderr the human one.
function startWatch(worldDir: string): Streams {
  const child = spawn(process.execPath, [BIN_PATH, 'sync', '--watch', '--json', worldDir], {
    env: CHILD_ENV,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const streams: Streams = {
    child,
    stdout: '',
    stderr: '',
    exited: new Promise((resolve) => {
      child.once('close', (code) => resolve(code));
    }),
  };
  child.stdout?.setEncoding('utf8').on('data', (chunk: string) => {
    streams.stdout += chunk;
  });
  child.stderr?.setEncoding('utf8').on('data', (chunk: string) => {
    streams.stderr += chunk;
  });
  return streams;
}

// The complete stdout lines only: the last piece may still be arriving, so it waits for its newline.
function completeLines(text: string): string[] {
  return text.split('\n').slice(0, -1);
}

function arrayLines(stdout: string): string[] {
  return completeLines(stdout).filter((line) => line.startsWith('['));
}

function rowsOf(line: string): Row[] {
  const parsed: unknown = JSON.parse(line);
  assert.ok(Array.isArray(parsed), `stdout carries diagnostics arrays only, got: ${line}`);
  return parsed as Row[];
}

// Poll until cond holds or the budget burns; the failure names both streams, so a missing line reads as what the watch said.
async function waitUntil(cond: () => boolean, label: string, watch: Streams): Promise<void> {
  const deadline = Date.now() + WAIT_MS;
  while (!cond()) {
    assert.ok(
      Date.now() < deadline,
      `timed out waiting for ${label}; stdout:\n${watch.stdout}\nstderr:\n${watch.stderr}`,
    );
    await sleep(100);
  }
}

// The restore runs as a one-shot CLI process, so the generated folder is whole again before the case ends.
function restoreWorld(worldDir: string): void {
  const restored = spawnSync(process.execPath, [BIN_PATH, 'sync', worldDir], { env: CHILD_ENV, encoding: 'utf8' });
  if (restored.status !== 0) throw new Error(`restoring the world failed: ${restored.stdout}${restored.stderr}`);
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  const tokensPath = path.join(c.worldDir, 'theme', 'tokens.ts');
  const tokensSource = fs.readFileSync(tokensPath, 'utf8');
  // The runner's own sync may leave its cold tasty build in flight; land it before the watcher writes the same folder.
  await flushReferenceBuild(c.worldDir);

  const watch = startWatch(c.worldDir);
  try {
    await waitUntil(() => arrayLines(watch.stdout).length >= 1, 'the baseline diagnostics array on stdout', watch);
    const baseline = arrayLines(watch.stdout).length;

    fs.writeFileSync(tokensPath, BROKEN_TOKENS);
    await waitUntil(() => watch.stderr.includes(BOOM), 'the failed resync line on stderr', watch);
    await waitUntil(() => arrayLines(watch.stdout).length > baseline, 'a diagnostics array for the failed sync event', watch);
    await sleep(500);

    const failedEvents = arrayLines(watch.stdout).slice(baseline).map(rowsOf);
    assert.ok(failedEvents.length >= 1, `the failed sync event printed no array; stdout:\n${watch.stdout}`);
    for (const rows of failedEvents) {
      assert.equal(rows.length, 1, `a failed sync event prints one error row, got ${JSON.stringify(rows)}`);
      assert.equal(rows[0]?.severity, 'error', `the failure row is an error, got ${JSON.stringify(rows)}`);
      assert.ok(String(rows[0]?.message).includes(BOOM), `the failure row carries the failure, got ${JSON.stringify(rows)}`);
    }
    const stray = completeLines(watch.stdout).filter((line) => line !== '' && !line.startsWith('['));
    assert.deepEqual(stray, [], 'stdout carries nothing but diagnostics arrays under --json');

    watch.child.kill('SIGINT');
    const code = await exitWithin(watch.exited, WAIT_MS);
    assert.equal(code, 0, 'SIGINT stops a json watch with exit code 0 after a failed sync event');
  } finally {
    if (watch.child.exitCode === null && watch.child.signalCode === null) {
      watch.child.kill('SIGKILL');
      await watch.exited;
    }
    fs.writeFileSync(tokensPath, tokensSource);
    restoreWorld(c.worldDir);
  }
}
