// five-way-contention.spec.ts — spec for CORE-WATCH-09, the concurrent one-shot case. Takes { case } from the runner and
// asserts node-side over a temp world: five real `ref sync` processes are held at a gate in the config so they reach the
// session lock together, then released, four times over fresh brands. Every process must end with exit 0 or 75 and no
// signal, at least one must win with 0, every 75 must name its superseder, the lock must be gone, and the sheet must
// carry the round's brand. Emits nothing on success; throws naming the round and the process on failure.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CoreCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import {
  disposeWorld,
  lockOf,
  makeWorld,
  outOf,
  runCli,
  setBrand,
  sleep,
  spawnCli,
  type CliHandle,
  type CliRun,
} from '../../shared/commit-world.ts';

interface SpecInput {
  page: SpecPage;
  case: CoreCase;
}

const ONE_SHOTS = 5;
const COLORS = ['#2a5c8f', '#8f2a5c', '#5c8f2a', '#8f5c2a'];
const ARRIVE_BUDGET_MS = 90000;

const gateOf = (dir: string): string => join(dir, 'start.gate');
const arrivedOf = (dir: string): string => join(dir, 'arrived.log');

// The config holds every process that loads it at the starting line while the gate file exists, and logs each pid as it
// arrives. A held config load sits before the lock, so all five reach the lock in the same instant once it opens.
function gatedConfig(dir: string): string {
  return [
    "import { appendFileSync, existsSync } from 'node:fs'",
    "import { defineConfig } from '@reference-ui/core'",
    `const GATE = ${JSON.stringify(gateOf(dir))}`,
    `const ARRIVED = ${JSON.stringify(arrivedOf(dir))}`,
    "if (existsSync(GATE)) appendFileSync(ARRIVED, String(process.pid) + '\\n')",
    'while (existsSync(GATE)) await new Promise((resolve) => setTimeout(resolve, 5))',
    '',
    'export default defineConfig({',
    "  name: 'core-watch-09',",
    "  include: ['theme/**/*.{ts,tsx}'],",
    '})',
    '',
  ].join('\n');
}

function arrivals(dir: string): number {
  try {
    return readFileSync(arrivedOf(dir), 'utf8').split('\n').filter(Boolean).length;
  } catch {
    return 0;
  }
}

// Wait until every process is held at the gate, failing at once if one leaves early.
async function waitForAll(dir: string, runs: CliHandle[]): Promise<void> {
  const deadline = Date.now() + ARRIVE_BUDGET_MS;
  while (arrivals(dir) < runs.length) {
    const left = runs.find((run) => run.child.exitCode !== null || run.child.signalCode !== null);
    assert.equal(left, undefined, 'a one-shot left before it reached the gate');
    assert.ok(Date.now() < deadline, `timed out waiting for ${runs.length} one-shots at the gate, ${arrivals(dir)} arrived`);
    await sleep(20);
  }
}

// One round: a fresh brand, five processes held at the gate, then released together.
async function race(dir: string, brand: string): Promise<CliRun[]> {
  setBrand(dir, brand);
  rmSync(arrivedOf(dir), { force: true });
  writeFileSync(gateOf(dir), '');
  const runs = Array.from({ length: ONE_SHOTS }, () => spawnCli(['sync', dir], dir));
  await waitForAll(dir, runs);
  rmSync(gateOf(dir), { force: true });
  return Promise.all(runs.map((run) => run.done));
}

function check(round: number, results: CliRun[]): void {
  const label = (i: number): string => `round ${round}, one-shot ${i}`;
  results.forEach((result, i) => {
    assert.equal(result.signal, null, `${label(i)} died by ${result.signal}, not an exit: ${result.output}`);
    assert.ok(result.code === 0 || result.code === 75, `${label(i)} exited ${result.code}, not 0 or 75: ${result.output}`);
    if (result.code === 75) assert.match(result.output, /superseded by (sync|clean) pid \d+/, `${label(i)} exited 75 without naming its superseder`);
  });
  assert.ok(results.some((result) => result.code === 0), `round ${round}: no one-shot won with exit 0: ${results.map((r) => r.code).join(', ')}`);
}

export default async function run(_input: SpecInput): Promise<void> {
  const dir = makeWorld();
  try {
    writeFileSync(join(dir, 'ui.config.ts'), gatedConfig(dir));
    const baseline = await runCli(['sync', dir], dir);
    assert.equal(baseline.code, 0, `baseline sync exits 0, got ${baseline.code}: ${baseline.output}`);

    for (const [round, brand] of COLORS.entries()) {
      check(round, await race(dir, brand));
      assert.equal(existsSync(lockOf(dir)), false, `round ${round}: the sync lock is gone once the race ends`);
      const sheet = readFileSync(join(outOf(dir), 'styled', 'styles.css'), 'utf8').toLowerCase();
      assert.ok(sheet.includes(`--colors-brand: ${brand}`), `round ${round}: the winner's brand ${brand} is in the sheet`);
    }
  } finally {
    disposeWorld(dir);
  }
}
