// gitignored.spec.ts — spec for CORE-WATCH-05, the gitignored include case. Takes
// { case } from the runner with the world freshly synced and asserts node-side.
// A .gitignore ignores theme/gen/, which holds a css() file the include globs
// match. The engine compiles it, so an edit to it must resync the sheet.
// Emits nothing on success; throws naming the missed resync on failure.
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

const GEN_START = `import { css } from '@reference-ui/react'\n\nexport const gen = css({ zIndex: 5501 })\n`;
const GEN_CHANGED = `import { css } from '@reference-ui/react'\n\nexport const gen = css({ zIndex: 5502 })\n`;
const START_RULE = /__z_5501\s*\{\s*z-index:\s*5501/;
const CHANGED_RULE = /__z_5502\s*\{\s*z-index:\s*5502/;

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
  const gen = path.join(c.worldDir, 'theme', 'gen');
  const source = path.join(gen, 'x.ts');
  const ignoreFile = path.join(c.worldDir, '.gitignore');
  const sheetPath = path.join(c.worldDir, '.reference-ui', 'styled', 'styles.css');
  const sheet = (): string => fs.readFileSync(sheetPath, 'utf8');

  fs.rmSync(gen, { recursive: true, force: true });
  fs.mkdirSync(gen, { recursive: true });
  fs.writeFileSync(source, GEN_START);
  fs.writeFileSync(ignoreFile, 'theme/gen/\n');
  try {
    await sync(c.worldDir);
    assert.match(sheet(), START_RULE, 'baseline sheet compiles the gitignored include match');

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
      fs.writeFileSync(source, GEN_CHANGED);
      await waitFor(() => resyncs > before, 'resync after the gitignored edit');
      assert.match(sheet(), CHANGED_RULE, 'edit to the gitignored include match resyncs the sheet');
      assert.doesNotMatch(sheet(), START_RULE, 'edit to the gitignored include match drops the class it replaced');
      // A rewrite reports as change, or as add when the backend coalesces it with the
      // write that created the file; both nouns mean "resync this file".
      assert.ok(
        events.includes('change:theme/gen/x.ts') || events.includes('add:theme/gen/x.ts'),
        `watcher reports the gitignored edit, saw [${events.join(', ')}]`,
      );
    } finally {
      await handle.stop();
    }
  } finally {
    fs.rmSync(ignoreFile, { force: true });
    fs.rmSync(gen, { recursive: true, force: true });
    await sync(c.worldDir);
  }
}
