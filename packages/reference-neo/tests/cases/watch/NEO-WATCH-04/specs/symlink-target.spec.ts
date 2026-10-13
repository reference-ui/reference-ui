// symlink-target.spec.ts — spec for NEO-WATCH-04, the symlink target case. Takes
// { case } from the runner with the world freshly synced and asserts node-side.
// theme/linked.ts links to shared/colors.ts, outside include. An edit to the
// target must resync the sheet and be reported under the link's own path.
// Emits nothing on success; throws naming the missed resync on failure.
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

const SHARED_START = `import { css } from '@reference-ui/react'\n\nexport const shared = css({ zIndex: 4401 })\n`;
const SHARED_CHANGED = `import { css } from '@reference-ui/react'\n\nexport const shared = css({ zIndex: 4402 })\n`;
const START_RULE = /__z_4401\s*\{\s*z-index:\s*4401/;
const CHANGED_RULE = /__z_4402\s*\{\s*z-index:\s*4402/;

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
  const target = path.join(c.worldDir, 'shared', 'colors.ts');
  const link = path.join(c.worldDir, 'theme', 'linked.ts');
  const sheetPath = path.join(c.worldDir, '.reference-ui', 'styled', 'styles.css');
  const sheet = (): string => fs.readFileSync(sheetPath, 'utf8');

  fs.rmSync(link, { force: true });
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, SHARED_START);
  fs.symlinkSync(path.join('..', 'shared', 'colors.ts'), link);
  try {
    await sync(c.worldDir);
    assert.match(sheet(), START_RULE, 'baseline sheet reads the link through to its target');

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
      fs.writeFileSync(target, SHARED_CHANGED);
      await waitFor(() => resyncs > before, 'resync after the symlink target edit');
      assert.match(sheet(), CHANGED_RULE, 'edit to the target resyncs the sheet to the new class');
      assert.doesNotMatch(sheet(), START_RULE, 'edit to the target drops the class it replaced');
      // A rewrite reports as change, or as add when the backend coalesces it with the
      // write that created the target; both nouns mean "resync this file".
      assert.ok(
        events.includes('change:theme/linked.ts') || events.includes('add:theme/linked.ts'),
        `watcher reports the target edit under the link path, saw [${events.join(', ')}]`,
      );
    } finally {
      await handle.stop();
    }
  } finally {
    fs.rmSync(link, { force: true });
    fs.rmSync(path.join(c.worldDir, 'shared'), { recursive: true, force: true });
    await sync(c.worldDir);
  }
}
