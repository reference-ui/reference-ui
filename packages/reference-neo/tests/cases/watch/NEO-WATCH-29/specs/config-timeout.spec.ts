// config-timeout.spec.ts — spec for NEO-WATCH-29, a config whose top-level await never settles. Takes { case } from the
// runner and asserts two legs over temp worlds. One-shot: the real `ref sync` CLI on a never-settling config must end on
// its own with exit 1 and a `[ref] sync failed:` line that names the evaluation timeout, not Node's unsettled-await exit
// 13 with no line. Watch: a watch that resyncs that config reports the timeout through onError and keeps running, so once
// the config is fixed the next save resyncs the same watch and the sheet carries the fix. Emits nothing on success;
// throws naming the failed leg on failure. Each temp world is removed in a finally.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync } from '../../../../../src/sync/index.ts';
import { watchSync } from '../../../../../src/lib/watch/index.ts';
import { disposeWorld, makeWorld, REBRAND, runCli, setBrand, sleep } from '../../shared/commit-world.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The evaluation bound in src/config/evaluate.ts: a wedged config reports once this long has passed.
const TIMEOUT_LINE = /did not finish within 30000 ms/;
const REPORT_WAIT_MS = 45000;
const WAIT_MS = 20000;
const REBRAND_DECL = new RegExp(`--colors-brand:\\s*${REBRAND}`, 'i');
const NEVER_SETTLING_CONFIG = [
  "import { defineConfig } from '@reference-ui/neo'",
  '',
  '// Awaits a promise that nothing resolves, so evaluating this config can never finish.',
  'await new Promise(() => {})',
  '',
  'export default defineConfig({',
  "  name: 'neo-watch-29',",
  "  include: ['theme/**/*.{ts,tsx}'],",
  '})',
  '',
].join('\n');

// Poll until cond holds or the budget burns; the failure names the leg that never happened.
async function waitFor(cond: () => boolean, label: string, budgetMs: number): Promise<void> {
  const deadline = Date.now() + budgetMs;
  while (!cond()) {
    assert.ok(Date.now() < deadline, `timed out waiting for ${label}`);
    await sleep(100);
  }
}

async function oneShotLeg(): Promise<void> {
  const dir = makeWorld();
  try {
    fs.writeFileSync(path.join(dir, 'ui.config.ts'), NEVER_SETTLING_CONFIG);
    const cli = await runCli(['sync', dir], dir);
    assert.equal(cli.signal, null, `one-shot: the run ends on its own, not by ${cli.signal}: ${cli.output}`);
    assert.equal(cli.code, 1, `one-shot: a config that never settles exits 1, got ${cli.code}: ${cli.output}`);
    assert.match(cli.output, /^\[ref\] sync failed: /m, `one-shot: the failure prints a [ref] line: ${cli.output}`);
    assert.match(cli.output, /did not finish within \d+ ms/, `one-shot: the line names the evaluation timeout: ${cli.output}`);
  } finally {
    disposeWorld(dir);
  }
}

async function watchLeg(): Promise<void> {
  const dir = makeWorld();
  try {
    const configPath = path.join(dir, 'ui.config.ts');
    const sheetPath = path.join(dir, '.reference-ui', 'styled', 'styles.css');
    const validConfig = fs.readFileSync(configPath, 'utf8');
    await sync(dir);

    let resyncs = 0;
    const failures: string[] = [];
    const handle = await watchSync(dir, {
      onResync: () => {
        resyncs += 1;
      },
      onError: (error) => {
        failures.push(error.message);
      },
    });
    try {
      // The config never settles: the resync reports the timeout, and the watch goes on running.
      fs.writeFileSync(configPath, NEVER_SETTLING_CONFIG);
      await waitFor(
        () => failures.some((message) => TIMEOUT_LINE.test(message)),
        'the watch to report the evaluation timeout',
        REPORT_WAIT_MS
      );
      assert.equal(resyncs, 0, 'the timed-out resync is not counted as a success');

      // Fixing the config, with a token change alongside, resyncs the same watch: no restart is needed.
      fs.writeFileSync(configPath, validConfig);
      setBrand(dir, REBRAND);
      await waitFor(() => resyncs > 0, 'a resync after the config is fixed', WAIT_MS);
      assert.match(fs.readFileSync(sheetPath, 'utf8'), REBRAND_DECL, 'the resync after the fix reaches the sheet');
    } finally {
      await handle.stop();
    }
  } finally {
    disposeWorld(dir);
  }
}

export default async function run(_input: SpecInput): Promise<void> {
  await oneShotLeg();
  await watchLeg();
}
