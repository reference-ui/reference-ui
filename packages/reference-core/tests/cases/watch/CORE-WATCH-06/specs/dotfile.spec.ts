// dotfile.spec.ts — spec for CORE-WATCH-06, the dotfile include case. Takes
// { case } from the runner with the world freshly synced and asserts node-side.
// theme/.hidden.ts holds a css() call the include globs match; the engine walks
// dot entries, so an edit to it must resync the sheet. Emits nothing on success;
// throws naming the missed resync on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { CoreCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync } from '../../../../../src/sync/index.ts';
import { watchSync } from '../../../../../src/lib/watch/index.ts';

interface SpecInput {
  page: SpecPage;
  case: CoreCase;
}

const HIDDEN_START = `import { css } from '@reference-ui/react'\n\nexport const hidden = css({ zIndex: 6601 })\n`;
const HIDDEN_CHANGED = `import { css } from '@reference-ui/react'\n\nexport const hidden = css({ zIndex: 6602 })\n`;
const START_RULE = /__z_6601\s*\{\s*z-index:\s*6601/;
const CHANGED_RULE = /__z_6602\s*\{\s*z-index:\s*6602/;

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

export default async function run({ case: c }: SpecInput): Promise<void> {
  const hidden = path.join(c.worldDir, 'theme', '.hidden.ts');
  const sheetPath = path.join(c.worldDir, '.reference-ui', 'styled', 'styles.css');
  const sheet = (): string => fs.readFileSync(sheetPath, 'utf8');

  fs.writeFileSync(hidden, HIDDEN_START);
  try {
    await sync(c.worldDir);
    assert.match(sheet(), START_RULE, 'baseline sheet compiles the dotfile inside include');

    const events: string[] = [];
    let resyncs = 0;
    const handle = await watchSync(c.worldDir, {
      onChange: (change) => events.push(`${change.event}:${change.relativePath.replaceAll('\\', '/')}`),
      onResync: () => {
        resyncs += 1;
      },
    });
    try {
      // Let the subscriptions go fully live before the mutation, so no
      // pre-watch write backfills as a surprise event mid-proof.
      await sleep(500);
      const before = resyncs;
      fs.writeFileSync(hidden, HIDDEN_CHANGED);
      await waitFor(() => resyncs > before, 'resync after the dotfile edit');
      assert.match(sheet(), CHANGED_RULE, 'edit to the dotfile inside include resyncs the sheet');
      assert.doesNotMatch(sheet(), START_RULE, 'edit to the dotfile drops the class it replaced');
      // A rewrite reports as change, or as add when the backend coalesces it with the
      // write that created the file; both nouns mean "resync this file".
      assert.ok(
        events.includes('change:theme/.hidden.ts') || events.includes('add:theme/.hidden.ts'),
        `watcher reports the dotfile edit, saw [${events.join(', ')}]`,
      );
    } finally {
      await handle.stop();
    }
  } finally {
    fs.rmSync(hidden, { force: true });
    await sync(c.worldDir);
  }
}
