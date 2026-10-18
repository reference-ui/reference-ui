// watch-include.spec.ts — spec for NEO-SYNC-14's trigger-scope leg. Takes
// { case } from the runner with the world freshly synced and asserts
// node-side. Widening `include` under a live watch must widen what wakes
// the watcher; narrowing it must quiet the removed globs again. Emits
// nothing on success; throws naming the missed resync on failure.
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

// Canonical contents, normalized before the watch starts and restored in
// a finally, so the world is byte-clean for the next run even when an
// assertion fails midway.
const USES_START = `import { css } from '@reference-ui/react'\n\nexport const cls = css({ color: 'brand' })\n`;
const CONFIG_NARROW = `import { defineConfig } from '@reference-ui/neo'\n\nexport default defineConfig({\n  name: 'neo-sync14',\n  include: ['theme/**/*.{ts,tsx}'],\n})\n`;
const CONFIG_WIDE = `import { defineConfig } from '@reference-ui/neo'\n\nexport default defineConfig({\n  name: 'neo-sync14',\n  include: ['theme/**/*.{ts,tsx}', 'extra/**/*.{ts,tsx}'],\n})\n`;
const EXTRA_NEW = `import { css } from '@reference-ui/react'\n\nexport const fill = css({ backgroundColor: 'ink' })\n`;
const EXTRA_NARROW_PROBE = `import { css } from '@reference-ui/react'\n\nexport const probe = css({ backgroundColor: 'brand' })\n`;

const INK_FILL_RULE = /background-color\s*:\s*var\(--colors-ink\)/;

// Poll until cond holds or the budget burns; resyncs cost a full native
// compile, so the budget is generous and the failure names the wait.
async function waitFor(cond: () => boolean, label: string, budgetMs = 90000): Promise<void> {
  const deadline = Date.now() + budgetMs;
  while (!cond()) {
    assert.ok(Date.now() < deadline, `timed out waiting for ${label}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

// Settle until no resync lands for a full quiet window: a trailing pass
// behind a slow sync must drain before a quiet proof snapshots its
// baseline, or the proof blames the probe for the burst's own tail.
async function waitForQuiescence(count: () => number): Promise<void> {
  const deadline = Date.now() + 30000;
  let seen = count();
  let quietSince = Date.now();
  while (Date.now() - quietSince < 3000) {
    assert.ok(Date.now() < deadline, 'timed out waiting for resync quiescence');
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (count() !== seen) {
      seen = count();
      quietSince = Date.now();
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The live watch plus the paths and readers both legs share: the event
// log, the resync counter behind a reader, and the sheet reader.
interface WatchProof {
  worldDir: string;
  configPath: string;
  extraDir: string;
  sheet: () => string;
  events: string[];
  resyncCount: () => number;
}

// A slow compile still landing drains before the verdict: true when the
// trailing resync arrives, false when the budget burns — the caller
// fails naming the miss instead of timing out the whole spec.
async function drainTrailingResync(resyncCount: () => number, before: number): Promise<boolean> {
  try {
    await waitFor(() => resyncCount() > before, 'trailing resync after the change event', 30000);
    return true;
  } catch {
    return false;
  }
}

// Fixed observation window, never a throwing wait: the caller judges
// from the returned pair, so a control can still run — and stay green —
// even when the watcher misses.
async function observeResyncWindow(
  events: string[],
  eventsBefore: number,
  resyncCount: () => number,
  before: number,
): Promise<{ sawChange: boolean; sawResync: boolean }> {
  let sawChange = false;
  let sawResync = false;
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    if (events.length > eventsBefore) sawChange = true;
    if (resyncCount() > before) sawResync = true;
    if (sawChange && sawResync) break;
    await sleep(100);
  }
  if (sawChange && !sawResync) sawResync = await drainTrailingResync(resyncCount, before);
  return { sawChange, sawResync };
}

// Widening the config include must take effect for triggering: the widen
// itself resyncs (setup proof), then an add under the newly-added glob
// wakes the watcher and converges the sheet with one-shot. The control
// runs before the widen assertions, so a red leg always pairs with a
// green control — the tree state is proven, only the trigger scope can
// be stale.
async function proveWidenLeg(proof: WatchProof): Promise<void> {
  const seen = (entry: string): boolean => proof.events.includes(entry);
  let before = proof.resyncCount();
  fs.writeFileSync(proof.configPath, CONFIG_WIDE);
  await waitFor(() => proof.resyncCount() > before, 'resync after the config widen');
  // The rewrite may report as change or coalesce to add; both nouns mean
  // "resync this file", so the proof accepts either.
  assert.ok(
    seen('change:ui.config.ts') || seen('add:ui.config.ts'),
    `watcher reports the config widen, saw [${proof.events.join(', ')}]`,
  );

  before = proof.resyncCount();
  const eventsBefore = proof.events.length;
  fs.mkdirSync(proof.extraDir, { recursive: true });
  fs.writeFileSync(path.join(proof.extraDir, 'new.ts'), EXTRA_NEW);
  const { sawChange, sawResync } = await observeResyncWindow(proof.events, eventsBefore, proof.resyncCount, before);

  await sync(proof.worldDir);
  assert.match(proof.sheet(), INK_FILL_RULE, 'one-shot control compiles the ink fill on the identical tree');

  assert.ok(sawChange, `watcher reports the new-glob addition, saw [${proof.events.join(', ')}]`);
  assert.ok(sawResync, 'watcher resyncs after the new-glob addition');
  assert.match(proof.sheet(), INK_FILL_RULE, 'new-glob addition converges the ink fill through watch');
}

// Narrowing back must quiet the removed glob: after the narrow resync
// lands and the burst settles, an add under the removed glob wakes
// nothing and resyncs nothing.
async function proveNarrowLeg(proof: WatchProof): Promise<void> {
  const before = proof.resyncCount();
  fs.writeFileSync(proof.configPath, CONFIG_NARROW);
  await waitFor(() => proof.resyncCount() > before, 'resync after the config narrow');
  await waitForQuiescence(proof.resyncCount);
  const quietResyncs = proof.resyncCount();
  const quietEvents = proof.events.length;
  fs.writeFileSync(path.join(proof.extraDir, 'probe.ts'), EXTRA_NARROW_PROBE);
  await sleep(5000);
  assert.equal(proof.resyncCount(), quietResyncs, 'removed globs stop resyncing after the narrow');
  assert.ok(
    !proof.events.slice(quietEvents).some((entry) => entry.endsWith('extra/probe.ts')),
    `removed globs stop waking after the narrow, saw [${proof.events.slice(quietEvents).join(', ')}]`,
  );
}

// The runner synced this world once before serving: normalize to the
// narrow include, start the watcher, then prove the widen leg and the
// narrowing leg. Resync waits count deltas, never absolutes, so a
// coalesced burst cannot skip a wait. The watcher stops and the world
// restores in a finally, so no outcome leaves the tree dirty.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const configPath = path.join(c.worldDir, 'ui.config.ts');
  const configStart = fs.readFileSync(configPath, 'utf8');
  const target = path.join(c.worldDir, 'theme', 'uses.ts');
  const stray = path.join(c.worldDir, 'theme', 'extra.ts');
  const extraDir = path.join(c.worldDir, 'extra');
  const sheetPath = path.join(c.worldDir, '.reference-ui', 'styled', 'styles.css');
  const sheet = (): string => fs.readFileSync(sheetPath, 'utf8');

  fs.writeFileSync(configPath, CONFIG_NARROW);
  fs.writeFileSync(target, USES_START);
  fs.rmSync(stray, { force: true });
  fs.rmSync(extraDir, { recursive: true, force: true });
  await sync(c.worldDir);
  assert.doesNotMatch(sheet(), INK_FILL_RULE, 'baseline sheet has no ink fill yet');

  const events: string[] = [];
  let resyncs = 0;
  const handle = await watchSync(c.worldDir, {
    onChange: (change) => events.push(`${change.event}:${change.relativePath.replaceAll('\\', '/')}`),
    onResync: () => {
      resyncs += 1;
    },
  });
  try {
    // Let the subscriptions go fully live before the first mutation, so
    // no pre-watch write backfills as a surprise event mid-proof.
    await sleep(1500);
    const proof: WatchProof = {
      worldDir: c.worldDir,
      configPath,
      extraDir,
      sheet,
      events,
      resyncCount: () => resyncs,
    };
    await proveWidenLeg(proof);
    await proveNarrowLeg(proof);
  } finally {
    await handle.stop();
    fs.rmSync(extraDir, { recursive: true, force: true });
    fs.rmSync(stray, { force: true });
    fs.writeFileSync(target, USES_START);
    fs.writeFileSync(configPath, configStart);
    await sync(c.worldDir);
  }
}
