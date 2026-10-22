// stopping-edit.spec.ts — spec for CORE-WATCH-12, the stopping-watch case. Takes { case } from the runner and asserts
// node-side over a temp world: it syncs, starts the real `ref sync --watch` CLI, and gates the watch's next resync in
// the config before it reads anything. SIGINT begins the graceful stop while that resync waits; opening the gate lets it
// read its inputs and enter a fragment that spins; while it spins the brand token is edited, which that resync has
// already read. A real one-shot then runs: it must wait for the stopping watch and sync for itself (exit 0, no covered
// line, the edit in the sheet). The watch must end by an exit code. Throws naming the lost edit or the covered line.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CoreCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { disposeWorld, lockOf, makeWorld, outOf, runCli, setBrand, sleep, spawnCli } from '../../shared/commit-world.ts';

interface SpecInput {
  page: SpecPage;
  case: CoreCase;
}

const EDIT = '#123456';
const SPIN_MS = 1400;
const WAIT_BUDGET_MS = 60000;

const gateOf = (dir: string): string => join(dir, 'resync.gate');
const arrivedOf = (dir: string): string => join(dir, 'resync.arrived');
const spinningOf = (dir: string): string => join(dir, 'spinning.flag');

// The config holds a load in the pid the gate file names (the watch's) until the file is removed, and marks its arrival.
// A process evaluates an unchanged config bundle once, so the gated resync stamps the config anew to load it for real.
function gatedConfig(dir: string, stamp = 'boot'): string {
  return [
    "import { existsSync, readFileSync, writeFileSync } from 'node:fs'",
    "import { defineConfig } from '@reference-ui/core'",
    `const GATE = ${JSON.stringify(gateOf(dir))}`,
    `const ARRIVED = ${JSON.stringify(arrivedOf(dir))}`,
    'const gated = (): boolean => {',
    "  try { return readFileSync(GATE, 'utf8') === String(process.pid) } catch { return false }",
    '}',
    "if (gated()) writeFileSync(ARRIVED, '')",
    'while (gated()) await new Promise((resolve) => setTimeout(resolve, 10))',
    `export const holdStamp = ${JSON.stringify(stamp)}`,
    '',
    'export default defineConfig({',
    "  name: 'core-watch-12',",
    "  include: ['theme/**/*.{ts,tsx}'],",
    '})',
    '',
  ].join('\n');
}

// A fragment marks that the resync has read its inputs, then spins: the stopping watch stays alive and busy meanwhile.
function spinningFragment(dir: string): string {
  return [
    "import { tokens } from '@reference-ui/core'",
    '',
    `process.getBuiltinModule('node:fs').writeFileSync(${JSON.stringify(spinningOf(dir))}, String(process.pid))`,
    'const started = Date.now()',
    `while (Date.now() - started < ${SPIN_MS}) {}`,
    "tokens({ colors: { spun: { value: '#abcdef' } } })",
    '',
  ].join('\n');
}

async function waitUntil(cond: () => boolean, label: string): Promise<void> {
  const deadline = Date.now() + WAIT_BUDGET_MS;
  while (!cond()) {
    assert.ok(Date.now() < deadline, `timed out waiting for ${label}`);
    await sleep(10);
  }
}

function watchIsStopping(dir: string): boolean {
  try {
    return (JSON.parse(readFileSync(join(lockOf(dir), 'watch-state.json'), 'utf8')) as { stopping?: boolean }).stopping === true;
  } catch {
    return false;
  }
}

function sheetCarries(dir: string, brand: string): boolean {
  const sheet = join(outOf(dir), 'styled', 'styles.css');
  return existsSync(sheet) && readFileSync(sheet, 'utf8').toLowerCase().includes(`--colors-brand: ${brand}`);
}

export default async function run(_input: SpecInput): Promise<void> {
  const dir = makeWorld();
  try {
    writeFileSync(join(dir, 'ui.config.ts'), gatedConfig(dir));
    const baseline = await runCli(['sync', dir], dir);
    assert.equal(baseline.code, 0, `baseline sync exits 0, got ${baseline.code}: ${baseline.output}`);

    const watch = spawnCli(['sync', '--watch', dir], dir);
    let watchOutput = '';
    watch.child.stdout?.on('data', (chunk: Buffer) => {
      watchOutput += chunk.toString('utf8');
    });
    await waitUntil(() => /ready in \d+ ms/.test(watchOutput), `the watch to boot; it said: ${watchOutput}`);

    // The gate goes up first, so the resync this fragment causes waits before it reads anything.
    writeFileSync(gateOf(dir), String(watch.child.pid));
    writeFileSync(join(dir, 'ui.config.ts'), gatedConfig(dir, 'held'));
    mkdirSync(join(dir, 'theme'), { recursive: true });
    writeFileSync(join(dir, 'theme', 'spin.ts'), spinningFragment(dir));
    await waitUntil(() => existsSync(arrivedOf(dir)), 'the watch resync to reach the gate');

    watch.child.kill('SIGINT');
    await waitUntil(() => watchIsStopping(dir), 'the watch to publish that it is stopping');
    rmSync(gateOf(dir), { force: true });
    await waitUntil(() => existsSync(spinningOf(dir)), 'the resync to read its inputs and start spinning');

    // This edit is saved after the stopping watch's only remaining resync has read its inputs.
    setBrand(dir, EDIT);
    const oneShot = await runCli(['sync', dir], dir);
    assert.equal(oneShot.code, 0, `the one-shot exits 0, got ${oneShot.code}: ${oneShot.output}`);
    assert.doesNotMatch(oneShot.output, /already watching/, 'the one-shot must not report itself covered by a stopping watch');
    assert.ok(sheetCarries(dir, EDIT), `the edit ${EDIT} saved while the watch was stopping is in the sheet; the one-shot said: ${oneShot.output}`);

    const end = await watch.done;
    assert.equal(end.signal, null, `the watch ends by an exit code, not signal ${end.signal}: ${end.output}`);
  } finally {
    disposeWorld(dir);
  }
}
