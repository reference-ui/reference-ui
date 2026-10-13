// lock-reassert.spec.ts — spec for NEO-WATCH-07, the lost-lock case. Takes
// { case } from the runner with the world freshly synced and asserts node-side.
// The watch holds the sync lock inside the generated folder; deleting that folder
// must not free the lock. The spec waits for the watch to re-assert its owner,
// then runs a real one-shot `ref sync` in its own process, which must report the
// live watch and exit 0 without a sync of its own. Emits nothing on success;
// throws naming the failed leg on failure.
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync } from '../../../../../src/sync/index.ts';
import { watchSync } from '../../../../../src/lib/watch/index.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

const BASE_RULE = /__c_brand\s*\{\s*color:\s*var\(--colors-brand\)/;

// Poll until cond holds or the budget burns; a resync is one native compile,
// so the budget is generous and the failure names the wait.
async function waitFor(cond: () => boolean, label: string): Promise<void> {
  const deadline = Date.now() + 30000;
  while (!cond()) {
    assert.ok(Date.now() < deadline, `timed out waiting for ${label}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Resolves true once the owner document is back, false when the budget burns,
// so the caller names the miss instead of timing out the whole spec.
async function lockReasserted(ownerPath: string, budgetMs: number): Promise<boolean> {
  const deadline = Date.now() + budgetMs;
  while (!fs.existsSync(ownerPath)) {
    if (Date.now() >= deadline) return false;
    await sleep(100);
  }
  return true;
}

interface OneShotResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

// The CLI entry, four levels above this case folder: tests/cases/watch/<ID>.
function refBinOf(caseDir: string): string {
  return path.resolve(caseDir, '..', '..', '..', '..', 'bin', 'ref.ts');
}

// A real one-shot `ref sync` in its own process, the command a user runs beside
// a live watch. Async spawn keeps this process's event loop free to take the
// poke the one-shot sends back.
function runOneShot(refBin: string, cwd: string): Promise<OneShotResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [refBin, 'sync', cwd], { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const killTimer = setTimeout(() => child.kill('SIGKILL'), 120000);
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });
    child.on('error', (error) => {
      clearTimeout(killTimer);
      reject(error);
    });
    child.on('close', (status) => {
      clearTimeout(killTimer);
      resolve({ status, stdout, stderr });
    });
  });
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const ownerPath = path.join(outDir, 'sync.lock', 'owner.json');
  const sheetPath = path.join(outDir, 'styled', 'styles.css');
  const sheet = (): string => fs.readFileSync(sheetPath, 'utf8');

  await sync(c.worldDir);
  assert.match(sheet(), BASE_RULE, 'baseline sheet carries the brand utility');

  let resyncs = 0;
  const handle = await watchSync(c.worldDir, {
    onResync: () => {
      resyncs += 1;
    },
  });
  try {
    // Let the subscriptions go fully live before the deletion.
    await sleep(500);
    fs.rmSync(outDir, { recursive: true, force: true });
    const reasserted = await lockReasserted(ownerPath, 10000);
    assert.ok(reasserted, 'watch re-asserts its sync lock within 10 s of the generated folder being deleted');

    const before = resyncs;
    const oneShot = await runOneShot(refBinOf(c.dir), c.worldDir);
    assert.equal(oneShot.status, 0, `one-shot sync exits 0, got ${oneShot.status}: ${oneShot.stderr}`);
    assert.match(oneShot.stdout, /already watching this project/, `one-shot sync reports the live watch, got: ${oneShot.stdout}`);
    assert.doesNotMatch(oneShot.stdout, /ready in/, 'one-shot sync does not run its own sync beside the watch');

    // The poke resyncs the watch, which regenerates the folder the deletion removed.
    await waitFor(() => resyncs > before, 'resync after the one-shot poke');
    assert.match(sheet(), BASE_RULE, 'the watch resync regenerates the sheet the deletion removed');
  } finally {
    await handle.stop();
    await sync(c.worldDir);
  }
}
