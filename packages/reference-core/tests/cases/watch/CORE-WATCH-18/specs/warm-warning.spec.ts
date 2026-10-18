// warm-warning.spec.ts — spec for CORE-WATCH-18, the save-time tasty warning proof. Takes { case } from the runner with
// the world freshly synced, starts the real `ref sync --watch` CLI as a child process, and reads the lines it prints.
// A save that adds a file importing a missing type makes the warm tasty rebuild warn, and the resync line that save
// causes must count that warning as "1 warning" on the same line as its success. The file is removed, the watch stops
// on SIGINT, and the world restores in a finally, so no outcome leaves the tree dirty. Emits nothing on success; throws
// naming the printed line or the watch's output.
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

const BIN_PATH = fileURLToPath(new URL('../../../../../bin/ref.ts', import.meta.url));
const CHILD_ENV = { ...process.env, NO_COLOR: '1' };
const READY_TEXT = 'ready in';
const SUCCESS_TEXT = 'ref sync';
const WARNING_TEXT = '1 warning';
const WAIT_MS = 60000;
const WARNING_SOURCE = "import type { Missing } from './missing-types'\nexport type Keep = Missing\n";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The exit code, or undefined when the child is still running after the budget, so a watch that ignores SIGINT fails
// the case instead of hanging the runner.
function exitWithin(exited: Promise<number | null>, ms: number): Promise<number | null | undefined> {
  return Promise.race([exited, sleep(ms).then(() => undefined)]);
}

// Stdout and stderr land in one list in arrival order, so a line never races its neighbour's split. The exit record
// resolves on close, after both streams end, so every line the child printed is in the list before the spec reads it.
function startWatch(worldDir: string): { child: ChildProcess; lines: string[]; exited: Promise<number | null> } {
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
  const exited = new Promise<number | null>((resolve) => {
    child.once('close', (code) => resolve(code));
  });
  return { child, lines, exited };
}

// Poll until cond holds or the budget burns; the failure names every line the watch printed.
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
  const addedPath = path.join(c.worldDir, 'theme', 'dangling.ts');
  // The runner's own sync may leave its cold tasty build in flight; land it before the watcher writes the same folder.
  await flushReferenceBuild(c.worldDir);
  fs.rmSync(addedPath, { force: true });

  const { child, lines, exited } = startWatch(c.worldDir);
  try {
    await waitUntil(() => lines.some((line) => line.includes(READY_TEXT)), 'the watch boot block', lines);

    const mark = lines.length;
    fs.writeFileSync(addedPath, WARNING_SOURCE);
    await waitUntil(() => lines.slice(mark).some((line) => line.includes(SUCCESS_TEXT)), 'the resync line for the save', lines);
    const resync = lines.slice(mark).find((line) => line.includes(SUCCESS_TEXT)) ?? '';
    assert.ok(
      resync.includes(WARNING_TEXT),
      `the resync line must count the tasty warning the save raised, got: ${resync}`,
    );

    child.kill('SIGINT');
    const code = await exitWithin(exited, WAIT_MS);
    assert.equal(code, 0, 'SIGINT stops the watch with exit code 0 once its resync is printed');
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGKILL');
      await exited;
    }
    fs.rmSync(addedPath, { force: true });
    restoreWorld(c.worldDir);
  }
}
