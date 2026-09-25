// watch-flag.spec.ts — spec for NEO-CLI-02, the bin --watch flag-path proof.
// Takes { case } with the world freshly synced and drives the real spawned
// `ref sync --watch` binary through four legs: the watcher boots with its
// boot block and watch row, a token edit triggers a sync one-liner plus a
// changed sheet, a --debug spawn traces the file event on the dev-only
// channel, and SIGTERM shuts the resident child down with exit 0. Emits
// nothing on success; throws naming the leg and the failed expectation on
// failure.
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

const BIN_PATH = fileURLToPath(new URL('../../../../../bin/ref.ts', import.meta.url));
const BRAND_VALUE = '#7c3aed';
const CHANGED_VALUE = '#0e5c3f';
// The boot header and the §3.12 resync one-liner: brand + version + ready
// time, then glyph + command + stats. Plain under a pipe, ANSI-spanned
// under a terminal — the pins strip spans first, so the shapes hold
// however the child ran.
const BOOT_BLOCK_RE = /REF  v\d+\.\d+\.\d+  ready in \d+ ms/;
const SYNC_LINE_RE = /⎔ ref sync ⫶ \d+ ms ⫶ [\d.]+ (B|KB|MB)/;
const ANSI_SPAN_RE = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

// Canonical spelling, byte-identical to the committed world source. The
// changed spelling derives by single-line replacement, so only the intended
// line can ever differ between the mutation and its restore.
const TOKENS_START = `// tokens.ts — the NEO-CLI-02 token fragment. It takes the author tokens()
// collector and emits two color tokens, brand and ink. The resync leg
// rewrites brand's value mid-run to prove the spawned watcher resyncs on
// a file mutation, then restores this canonical spelling in a finally.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    brand: { value: '#7c3aed' },
    ink: { value: '#1a1a2e' },
  },
})
`;
const TOKENS_CHANGED = TOKENS_START.replace(BRAND_VALUE, CHANGED_VALUE);

interface WatchChild {
  child: ChildProcess;
  output: () => string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Spawns the real bin in watch mode with piped streams. Stdout and stderr
// accumulate into one buffer, since the bin reports failures on stdout and
// the failure text should read as the child's own verdict either way.
function spawnWatch(worldDir: string, extraArgs: string[] = []): WatchChild {
  const child = spawn(process.execPath, [BIN_PATH, 'sync', '--watch', ...extraArgs, worldDir], {
    cwd: worldDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let text = '';
  child.stdout?.on('data', (chunk: Buffer) => {
    text += chunk.toString('utf8');
  });
  child.stderr?.on('data', (chunk: Buffer) => {
    text += chunk.toString('utf8');
  });
  return { child, output: () => text };
}

function stripAnsiSpans(text: string): string {
  return text.replace(ANSI_SPAN_RE, '');
}

function syncLineCount(watch: WatchChild): number {
  return stripAnsiSpans(watch.output()).split('⎔ ref sync').length - 1;
}

function childDone(watch: WatchChild): boolean {
  return watch.child.exitCode !== null || watch.child.signalCode !== null;
}

// Polls the child's output until the predicate holds. An early child exit
// throws with the full output attached, so a boot failure reads as the
// bin's own verdict instead of a bare timeout.
async function waitForOutput(watch: WatchChild, cond: () => boolean, label: string): Promise<void> {
  const deadline = Date.now() + 90000;
  while (!cond()) {
    if (childDone(watch)) {
      throw new Error(`watch child exited early waiting for ${label}:\n${watch.output()}`);
    }
    assert.ok(Date.now() < deadline, `timed out waiting for ${label}:\n${watch.output()}`);
    await sleep(100);
  }
}

// The boot leg: the boot header proves the --watch flag routed to the
// bin's watch command, the baseline sync ran, and the watcher subscriptions
// are live — so no settle sleep is needed before the first mutation.
async function proveBoot(watch: WatchChild): Promise<void> {
  await waitForOutput(watch, () => BOOT_BLOCK_RE.test(stripAnsiSpans(watch.output())), 'the boot block');
  assert.ok(stripAnsiSpans(watch.output()).includes('→ CSS:'), 'watch boot prints the CSS row');
  assert.ok(stripAnsiSpans(watch.output()).includes('→ Watch:'), 'watch boot prints the watch row');
  assert.match(
    stripAnsiSpans(watch.output()),
    /Warnings:\s+\d+ \[--verbose\]/,
    'watch boot folds the background ref warnings into its block',
  );
  assert.equal(
    stripAnsiSpans(watch.output()).match(/\d+ \[--verbose\]/g)?.length ?? 0,
    1,
    'the folded row is the only warning line at boot',
  );
  assert.ok(!watch.output().includes('watching'), 'boot prints no watching line');
  assert.ok(!watch.output().includes('Built reference'), 'boot prints no built-reference trivia');
}

// The resync leg: one token-value edit must surface as another sync
// one-liner with no file-event lines and no resync word, plus a changed
// sheet. Waits count sync-line deltas, never absolutes, so a coalesced
// burst cannot skip a wait. Restoring the spelling resyncs again and flips
// the pin back.
async function proveResync(watch: WatchChild, worldDir: string): Promise<void> {
  const tokensFile = path.join(worldDir, 'theme', 'tokens.ts');
  const sheetPath = path.join(worldDir, '.reference-ui', 'styled', 'styles.css');
  const sheet = (): string => fs.readFileSync(sheetPath, 'utf8').toLowerCase();

  let before = syncLineCount(watch);
  fs.writeFileSync(tokensFile, TOKENS_CHANGED);
  await waitForOutput(watch, () => syncLineCount(watch) > before, 'resync after the token edit');
  assert.ok(
    SYNC_LINE_RE.test(stripAnsiSpans(watch.output())),
    'resync prints the sync one-liner',
  );
  assert.ok(
    !watch.output().includes('resync'),
    'resync prints no resync word',
  );
  assert.ok(
    !/\[ref\] (add|change|unlink) /.test(watch.output()),
    'default watch prints no file-event lines',
  );
  assert.ok(
    sheet().includes(`--colors-brand: ${CHANGED_VALUE}`),
    'resynced sheet carries the edited token value',
  );

  before = syncLineCount(watch);
  fs.writeFileSync(tokensFile, TOKENS_START);
  await waitForOutput(watch, () => syncLineCount(watch) > before, 'resync after the restore');
  assert.ok(
    sheet().includes(`--colors-brand: ${BRAND_VALUE}`),
    'restored sheet carries the canonical token value',
  );
}

// The debug leg: a --debug spawn traces the triggering file event on the
// dev-only channel while the sync one-liner still prints. The event line
// never appears without the flag (proved above); here it must.
async function proveDebugEvents(watch: WatchChild, worldDir: string): Promise<void> {
  const tokensFile = path.join(worldDir, 'theme', 'tokens.ts');
  await waitForOutput(watch, () => BOOT_BLOCK_RE.test(stripAnsiSpans(watch.output())), 'the debug boot block');
  const before = syncLineCount(watch);
  fs.writeFileSync(tokensFile, TOKENS_CHANGED);
  await waitForOutput(
    watch, () => watch.output().includes('change theme/tokens.ts'), 'the debug event line',
  );
  await waitForOutput(watch, () => syncLineCount(watch) > before, 'the debug resync line');
  assert.ok(
    SYNC_LINE_RE.test(stripAnsiSpans(watch.output())),
    'debug resync still prints the sync one-liner',
  );
}

// The shutdown leg: SIGTERM must exit the resident child 0 — the bin
// intercepts the signal and stops the watcher, so an exit by signal here
// would mean the graceful path never ran.
async function proveShutdown(watch: WatchChild): Promise<void> {
  watch.child.kill('SIGTERM');
  const deadline = Date.now() + 30000;
  while (!childDone(watch)) {
    assert.ok(Date.now() < deadline, `timed out waiting for watch shutdown:\n${watch.output()}`);
    await sleep(50);
  }
  assert.equal(watch.child.signalCode, null, 'shutdown exits by code, not by signal');
  assert.equal(watch.child.exitCode, 0, 'shutdown exits 0');
}

// Reaps a live child without throwing: SIGTERM, a grace wait, then SIGKILL.
// Runs in the finally, so it must never mask the assertion that failed.
async function reapQuietly(watch: WatchChild): Promise<void> {
  try {
    if (childDone(watch)) return;
    watch.child.kill('SIGTERM');
    const deadline = Date.now() + 10000;
    while (!childDone(watch) && Date.now() < deadline) {
      await sleep(50);
    }
    if (!childDone(watch)) watch.child.kill('SIGKILL');
  } catch {
    console.log('[NEO-CLI-02] warning: watch child reap failed; check for an orphaned ref process');
  }
}

// The runner synced this world before serving: spawn the watcher, prove
// boot, resync, and shutdown in order, then a --debug spawn for the event
// channel leg, then reap the children, restore the canonical spelling, and
// heal with a one-shot sync in a finally, so no outcome leaves the world
// dirty or unusable for the next run.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const tokensFile = path.join(c.worldDir, 'theme', 'tokens.ts');
  const watch = spawnWatch(c.worldDir);
  try {
    await proveBoot(watch);
    await proveResync(watch, c.worldDir);
    await proveShutdown(watch);
  } finally {
    await reapQuietly(watch);
  }
  const debug = spawnWatch(c.worldDir, ['--debug']);
  try {
    await proveDebugEvents(debug, c.worldDir);
    await proveShutdown(debug);
  } finally {
    await reapQuietly(debug);
    fs.writeFileSync(tokensFile, TOKENS_START);
    try {
      execFileSync(process.execPath, [BIN_PATH, 'sync', c.worldDir], {
        cwd: c.worldDir,
        stdio: 'ignore',
        timeout: 120000,
      });
    } catch {
      console.log('[NEO-CLI-02] warning: final heal sync failed; the runner re-syncs before the next serve');
    }
  }
}
