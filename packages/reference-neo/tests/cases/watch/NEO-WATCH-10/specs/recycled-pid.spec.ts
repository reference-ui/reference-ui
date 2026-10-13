// recycled-pid.spec.ts — spec for NEO-WATCH-10, the recycled-pid case. Takes { case } from the runner and asserts
// node-side over temp worlds: a stale lock is planted that names a live unrelated process (a `sleep` the spec starts) or
// pid 1, with no identity on the owner document. Four legs: a one-shot over a stale one-shot lock takes over and leaves
// the stranger running; a one-shot over a stale watch lock syncs instead of poking it; `ref sync --watch` over a stale
// watch lock boots instead of attaching to the stranger; a lock naming pid 1 is taken over. POSIX only, and it needs an
// identity source (ps or /proc), so elsewhere the spec says so and stands down. Throws naming the failed leg on failure.
import assert from 'node:assert/strict';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import {
  disposeWorld,
  lockOf,
  makeWorld,
  outOf,
  REBRAND,
  runCli,
  setBrand,
  sleep,
  spawnCli,
} from '../../shared/commit-world.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

const THIRD = '#123456';
const BOOT_BUDGET_MS = 60000;
const strangers: ChildProcess[] = [];

// A same-user process that has nothing to do with sync, whose pid a stale lock will name.
function startStranger(): ChildProcess & { pid: number } {
  const child = spawn('sleep', ['100'], { stdio: 'ignore' });
  if (child.pid === undefined) throw new Error('the unrelated process did not start');
  strangers.push(child);
  return child as ChildProcess & { pid: number };
}

function running(child: ChildProcess): boolean {
  return child.exitCode === null && child.signalCode === null;
}

// The lock a dead sync would leave: an owner document naming `pid`, written without an identity.
function plantOwner(dir: string, pid: number, kind: 'one-shot' | 'watch'): void {
  rmSync(lockOf(dir), { recursive: true, force: true });
  mkdirSync(lockOf(dir), { recursive: true });
  writeFileSync(join(lockOf(dir), 'owner.json'), JSON.stringify({ pid, lockNonce: 'recycled', kind, argv: [], startedAt: '' }));
}

function sheetCarries(dir: string, brand: string): boolean {
  const sheet = join(outOf(dir), 'styled', 'styles.css');
  return existsSync(sheet) && readFileSync(sheet, 'utf8').toLowerCase().includes(`--colors-brand: ${brand}`);
}

function hasIdentitySource(): boolean {
  if (process.platform === 'win32') return false;
  return spawnSync('ps', ['-o', 'lstart=', '-p', String(process.pid)], { stdio: 'ignore' }).status === 0 || existsSync('/proc/self/stat');
}

async function oneShotLeavesTheStranger(dir: string): Promise<void> {
  const stranger = startStranger();
  plantOwner(dir, stranger.pid, 'one-shot');
  setBrand(dir, REBRAND);
  const run = await runCli(['sync', dir], dir);
  assert.equal(run.code, 0, `a one-shot over a recycled one-shot lock exits 0, got ${run.code}: ${run.output}`);
  assert.ok(running(stranger), `the unrelated process ${stranger.pid} was signaled (${stranger.signalCode}): ${run.output}`);
  assert.match(run.output, new RegExp(`stale lock \\(pid ${stranger.pid} now belongs to another process\\)`));
  assert.ok(sheetCarries(dir, REBRAND), 'the one-shot synced the new brand');
}

async function oneShotSyncsOverStaleWatch(dir: string): Promise<void> {
  const stranger = startStranger();
  plantOwner(dir, stranger.pid, 'watch');
  setBrand(dir, THIRD);
  const run = await runCli(['sync', dir], dir);
  assert.equal(run.code, 0, `a one-shot over a recycled watch lock exits 0, got ${run.code}: ${run.output}`);
  assert.doesNotMatch(run.output, /already watching/, 'a recycled watch lock is not a live watch to be covered by');
  assert.ok(running(stranger), `the unrelated process ${stranger.pid} was poked to death (${stranger.signalCode})`);
  assert.ok(sheetCarries(dir, THIRD), 'the one-shot synced instead of reporting covered with stale output');
}

async function watchBootsOverStaleWatch(dir: string): Promise<void> {
  const stranger = startStranger();
  plantOwner(dir, stranger.pid, 'watch');
  const watch = spawnCli(['sync', '--watch', dir], dir);
  let output = '';
  watch.child.stdout?.on('data', (chunk: Buffer) => {
    output += chunk.toString('utf8');
  });
  const deadline = Date.now() + BOOT_BUDGET_MS;
  while (!/ready in \d+ ms/.test(output)) {
    assert.ok(Date.now() < deadline, `the watch did not boot over the recycled lock; it said: ${output}`);
    assert.equal(watch.child.exitCode, null, `the watch exited before it booted: ${output}`);
    await sleep(50);
  }
  assert.doesNotMatch(output, /already watching/, 'the watch must not attach to the unrelated process');
  assert.ok(running(stranger), `the unrelated process ${stranger.pid} was signaled (${stranger.signalCode})`);
  watch.child.kill('SIGTERM');
  const end = await watch.done;
  assert.equal(end.code, 0, `the watch stops by exit code 0, got ${end.code} (${end.signal}): ${end.output}`);
}

async function oneShotTakesOverPidOne(dir: string): Promise<void> {
  plantOwner(dir, 1, 'one-shot');
  const first = await runCli(['sync', dir], dir);
  assert.equal(first.code, 0, `a lock naming pid 1 is taken over, got exit ${first.code}: ${first.output}`);
  assert.match(first.output, /stale lock \(pid 1 now belongs to another process\)/);
  const second = await runCli(['sync', dir], dir);
  assert.equal(second.code, 0, `the next sync exits 0, got ${second.code}: ${second.output}`);
  assert.doesNotMatch(second.output, /stale lock/);
}

export default async function run(_input: SpecInput): Promise<void> {
  if (!hasIdentitySource()) {
    console.log('[NEO-WATCH-10] no process identity source on this host (needs POSIX with ps or /proc); the leg is not run');
    return;
  }
  const dir = makeWorld();
  try {
    const baseline = await runCli(['sync', dir], dir);
    assert.equal(baseline.code, 0, `baseline sync exits 0, got ${baseline.code}: ${baseline.output}`);
    await oneShotLeavesTheStranger(dir);
    await oneShotSyncsOverStaleWatch(dir);
    await watchBootsOverStaleWatch(dir);
    await oneShotTakesOverPidOne(dir);
  } finally {
    for (const stranger of strangers.splice(0)) stranger.kill('SIGKILL');
    disposeWorld(dir);
  }
}
