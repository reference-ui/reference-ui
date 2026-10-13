// types-failure.spec.ts — spec for NEO-WATCH-08, the failed types build proof. Takes { case } from the runner with the
// world freshly synced, runs the real `ref sync --watch` CLI as a child process, and reads the lines it prints. A
// dangling link under include fails the tasty scan, so the resync that link causes must print the failure on its own
// line, never a success line. Removing the link and saving a good type recovers: a later resync prints success and the
// type lands in the generated types folder. Emits nothing on success; throws naming the printed line or the missing type.
import assert from 'node:assert/strict';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { flushReferenceBuild } from '../../../../../src/reference/bridge/index.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

const BIN_PATH = fileURLToPath(new URL('../../../../../bin/ref.ts', import.meta.url));
const CHILD_ENV = { ...process.env, NO_COLOR: '1' };
const READY_TEXT = 'ready in';
const SUCCESS_TEXT = 'ref sync';
const FAILURE_TEXT = 'watch error: reference tasty build failed';
const NEW_TYPE = 'export interface NewThing {\n  a: number\n}\n';
const TYPE_NAME = 'NewThing';
const WAIT_MS = 90000;
const STOP_MS = 15000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Stdout and stderr land in one list in arrival order, so a line never races its neighbour's split.
function startWatch(worldDir: string): { child: ChildProcess; lines: string[] } {
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
  }
  return { child, lines };
}

// Poll until cond holds or the budget burns; a resync costs a full sync plus a types build, so the budget is generous.
// The failure names every line the watch printed, so a missing line reads as what the watch actually said.
async function waitUntil(cond: () => boolean, label: string, lines: string[]): Promise<void> {
  const deadline = Date.now() + WAIT_MS;
  while (!cond()) {
    assert.ok(Date.now() < deadline, `timed out waiting for ${label}; the watch printed:\n${lines.join('\n')}`);
    await sleep(100);
  }
}

// A resync prints exactly one line: the success one-liner, or the failure line when the types build fails.
function isResyncLine(line: string): boolean {
  return line.includes(SUCCESS_TEXT) || line.includes(FAILURE_TEXT);
}

// Every file under the generated types folder; the tasty manifest and its chunks live there.
function filesUnder(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(full) : [full];
  });
}

function typesCarry(worldDir: string, name: string): boolean {
  return filesUnder(path.join(worldDir, '.reference-ui', 'types')).some((file) =>
    fs.readFileSync(file, 'utf8').includes(name)
  );
}

// SIGTERM is the watch's graceful stop (it exits once the in-flight sync settles); SIGKILL only if it hangs.
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

// The restore runs as a one-shot CLI process, so its tasty build lands before it returns and no warm refresh lane is
// left running in this process when the case ends.
function restoreWorld(worldDir: string): void {
  const restored = spawnSync(process.execPath, [BIN_PATH, 'sync', worldDir], { env: CHILD_ENV, encoding: 'utf8' });
  if (restored.status !== 0) throw new Error(`restoring the world failed: ${restored.stdout}${restored.stderr}`);
}

// The runner synced this world before serving it. The spec starts the resident CLI, breaks the types build with a
// dangling link, asserts the resync line reports the failure, then recovers and asserts a success line with the type
// landed. The child stops and the world restores in a finally, so no outcome leaves the tree dirty.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const link = path.join(c.worldDir, 'theme', 'dangling.ts');
  const added = path.join(c.worldDir, 'theme', 'newtype.ts');
  // The runner's own sync may leave its cold tasty build in flight; land it before the watcher writes the same folder.
  await flushReferenceBuild(c.worldDir);
  fs.rmSync(link, { force: true });
  fs.rmSync(added, { force: true });

  const { child, lines } = startWatch(c.worldDir);
  try {
    await waitUntil(() => lines.some((line) => line.includes(READY_TEXT)), 'the watch boot block', lines);

    // The first resync the dangling link causes must be the failure. A success line here is the bug: the failed types
    // build reported as success, while the stale types stayed behind with only a background line to say so.
    const mark = lines.length;
    fs.symlinkSync('../nowhere.ts', link);
    await waitUntil(() => lines.slice(mark).some(isResyncLine), 'the resync the dangling link causes', lines);
    const first = lines.slice(mark).find(isResyncLine) ?? '';
    assert.ok(first.includes(FAILURE_TEXT), `the resync must report the failed types build, but printed: ${first}`);

    // Recovery: the link goes, a good type is saved, and a later resync prints success once the type has landed.
    const recovered = lines.length;
    fs.rmSync(link, { force: true });
    fs.writeFileSync(added, NEW_TYPE);
    await waitUntil(
      () => lines.slice(recovered).some((line) => line.includes(SUCCESS_TEXT)) && typesCarry(c.worldDir, TYPE_NAME),
      `a success resync with ${TYPE_NAME} in the types folder`,
      lines
    );
  } finally {
    await stopWatch(child);
    fs.rmSync(link, { force: true });
    fs.rmSync(added, { force: true });
    restoreWorld(c.worldDir);
  }
}
