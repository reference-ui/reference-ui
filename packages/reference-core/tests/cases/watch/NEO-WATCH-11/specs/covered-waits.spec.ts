// covered-waits.spec.ts — spec for NEO-WATCH-11, the covered one-shot case. Takes { case } from the runner and asserts
// node-side over a temp world: it syncs, starts the real `ref sync --watch` CLI, and saves a fragment that spins in a
// CPU loop before it declares a token, which keeps the watch's resync in flight. A real one-shot then runs in its own
// process. It must exit 0 with the covered line naming the watch, and at the instant it exits the generated sheet must
// already carry the new token. Emits nothing on success; throws naming the stale sheet or the missing line on failure.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { disposeWorld, makeWorld, outOf, runCli, sleep, spawnCli } from '../../shared/commit-world.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

const SLOW_COLOR = '#5ca1ff';
const SPIN_MS = 4000;
const BOOT_BUDGET_MS = 60000;
const STOP_BUDGET_MS = 15000;

// A fragment that holds the watch's resync in flight for SPIN_MS before it declares the token.
function slowFragment(): string {
  return [
    "import { tokens } from '@reference-ui/neo'",
    '',
    'const started = Date.now()',
    `while (Date.now() - started < ${SPIN_MS}) {}`,
    `tokens({ colors: { slow: { value: '${SLOW_COLOR}' } } })`,
    '',
  ].join('\n');
}

function sheetCarriesToken(dir: string): boolean {
  const sheet = join(outOf(dir), 'styled', 'styles.css');
  return existsSync(sheet) && readFileSync(sheet, 'utf8').toLowerCase().includes(SLOW_COLOR);
}

export default async function run(_input: SpecInput): Promise<void> {
  const dir = makeWorld();
  try {
    const baseline = await runCli(['sync', dir], dir);
    assert.equal(baseline.code, 0, `baseline sync exits 0, got ${baseline.code}: ${baseline.output}`);
    assert.equal(sheetCarriesToken(dir), false, 'the baseline sheet does not carry the slow token yet');

    const watch = spawnCli(['sync', '--watch', dir], dir);
    let watchOutput = '';
    watch.child.stdout?.on('data', (chunk: Buffer) => {
      watchOutput += chunk.toString('utf8');
    });
    const bootBy = Date.now() + BOOT_BUDGET_MS;
    while (!/ready in \d+ ms/.test(watchOutput)) {
      assert.ok(Date.now() < bootBy, `the watch did not boot; it said: ${watchOutput}`);
      await sleep(50);
    }

    mkdirSync(join(dir, 'theme'), { recursive: true });
    writeFileSync(join(dir, 'theme', 'slow.ts'), slowFragment());
    await sleep(150);

    const oneShot = await runCli(['sync', dir], dir);
    // The sheet is read at the instant the one-shot has exited: exit 0 means the output is current.
    const currentAtExit = sheetCarriesToken(dir);
    assert.equal(oneShot.code, 0, `the one-shot exits 0, got ${oneShot.code}: ${oneShot.output}`);
    assert.ok(
      oneShot.stdout.includes(`already watching this project (pid ${watch.child.pid})`),
      `the one-shot reports the live watch, got: ${oneShot.output}`
    );
    assert.ok(currentAtExit, `the one-shot exited 0 with the saved token ${SLOW_COLOR} absent from the output (the watch was still resyncing)`);

    watch.child.kill('SIGTERM');
    const stopped = await Promise.race([watch.done, sleep(STOP_BUDGET_MS).then(() => undefined)]);
    assert.ok(stopped !== undefined, 'the watch stops on SIGTERM within its budget');
    assert.equal(stopped.code, 0, `the watch stops by exit code 0, got ${stopped.code} (${stopped.signal}): ${stopped.output}`);
  } finally {
    disposeWorld(dir);
  }
}
