// watch.spec.ts — spec for NEO-SYNC-14, the watch resync case. Takes
// { case } from the runner with the world freshly synced and asserts
// node-side. Emits nothing on success; throws naming the file edit the
// watcher missed, or the utility that failed to appear or disappear,
// on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync } from '../../../../../src/sync/index.ts';
import { watchSync } from '../../../../../src/sync/watch.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// Canonical contents, normalized before the watch starts and restored in
// a finally, so the world is byte-clean for the next run even when an
// assertion fails midway.
const USES_START = `import { css } from '@reference-ui/react'\n\nexport const cls = css({ color: 'brand' })\n`;
const USES_CHANGED = `import { css } from '@reference-ui/react'\n\nexport const cls = css({ color: 'ink' })\n`;
const EXTRA_ADDED = `import { css } from '@reference-ui/react'\n\nexport const fill = css({ backgroundColor: 'ink' })\n`;

const COLOR_RULE = /color\s*:\s*var\(--colors-brand\)/;
const INK_COLOR_RULE = /(?<!-)color\s*:\s*var\(--colors-ink\)/;
const INK_FILL_RULE = /background-color\s*:\s*var\(--colors-ink\)/;

// Poll until cond holds or the budget burns; resyncs cost a full native
// compile, so the budget is generous and the failure names the wait.
async function waitFor(cond: () => boolean, label: string): Promise<void> {
  const deadline = Date.now() + 90000;
  while (!cond()) {
    assert.ok(Date.now() < deadline, `timed out waiting for ${label}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The runner synced this world once before serving: normalize the edited
// sources, start the watcher, then prove an addition discovers a utility,
// a rewrite aligns one, and a deletion drops both. Resync waits count
// deltas, never absolutes, so a coalesced burst cannot skip a wait. The
// watcher stops and the world restores in a finally, so no outcome
// leaves the tree dirty.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const target = path.join(c.worldDir, 'theme', 'uses.ts');
  const extra = path.join(c.worldDir, 'theme', 'extra.ts');
  const sheetPath = path.join(c.worldDir, '.reference-ui', 'styled', 'styles.css');
  const sheet = (): string => fs.readFileSync(sheetPath, 'utf8');

  fs.writeFileSync(target, USES_START);
  fs.rmSync(extra, { force: true });
  await sync(c.worldDir);
  assert.match(sheet(), COLOR_RULE, 'baseline sheet carries the brand utility');
  assert.doesNotMatch(sheet(), INK_FILL_RULE, 'baseline sheet has no ink fill yet');

  const events: string[] = [];
  let resyncs = 0;
  const seen = (entry: string): boolean => events.includes(entry);
  const handle = await watchSync(c.worldDir, {
    onChange: (change) => events.push(`${change.event}:${change.relativePath.replaceAll('\\', '/')}`),
    onResync: () => {
      resyncs += 1;
    },
  });
  try {
    // Let the subscriptions go fully live before the first mutation, so
    // no pre-watch write backfills as a surprise event mid-proof.
    await sleep(500);

    let before = resyncs;
    fs.writeFileSync(extra, EXTRA_ADDED);
    await waitFor(() => resyncs > before, 'resync after the addition');
    assert.match(sheet(), INK_FILL_RULE, 'added source discovers the ink fill');
    assert.ok(seen('add:theme/extra.ts'), `watcher reports the addition, saw [${events.join(', ')}]`);

    // A rewrite resyncs as change — except when the backend coalesces it
    // with a near-subscription write and reports add (observed once under
    // group-run timing). Core treats both nouns as "resync this file",
    // so the proof accepts either and pins the alignment, not the noun.
    before = resyncs;
    fs.writeFileSync(target, USES_CHANGED);
    await waitFor(() => resyncs > before, 'resync after the change');
    assert.doesNotMatch(sheet(), COLOR_RULE, 'changed source drops the brand utility');
    assert.match(sheet(), INK_COLOR_RULE, 'changed source aligns the ink utility');
    assert.ok(
      seen('change:theme/uses.ts') || seen('add:theme/uses.ts'),
      `watcher reports the rewrite, saw [${events.join(', ')}]`,
    );

    before = resyncs;
    fs.rmSync(target);
    fs.rmSync(extra);
    await waitFor(() => resyncs > before, 'resync after the deletion');
    assert.doesNotMatch(sheet(), INK_FILL_RULE, 'deleted sources drop the ink fill');
    assert.doesNotMatch(sheet(), INK_COLOR_RULE, 'deleted sources drop the ink utility');
    assert.ok(seen('unlink:theme/uses.ts'), `watcher reports the deletion, saw [${events.join(', ')}]`);
    assert.ok(seen('unlink:theme/extra.ts'), `watcher reports the second deletion, saw [${events.join(', ')}]`);
  } finally {
    await handle.stop();
    fs.rmSync(extra, { force: true });
    fs.writeFileSync(target, USES_START);
    await sync(c.worldDir);
  }
}
