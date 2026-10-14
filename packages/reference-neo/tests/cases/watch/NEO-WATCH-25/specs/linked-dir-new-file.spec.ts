// linked-dir-new-file.spec.ts — spec for NEO-WATCH-25, a new file inside a symlinked directory target. Takes { case }
// from the runner with the world freshly synced and asserts node-side. theme/linkdir links to shared/empty, outside
// include, and the target is empty when the watch boots. A new file created in the target must resync the sheet and
// be reported under the link's own path. Emits nothing on success; throws naming the missed resync on failure.
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

const FRESH_SOURCE = `import { css } from '@reference-ui/react'\n\nexport const fresh = css({ zIndex: 2501 })\n`;
const FRESH_RULE = /__z_2501\s*\{\s*z-index:\s*2501/;

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
  const target = path.join(c.worldDir, 'shared', 'empty');
  const link = path.join(c.worldDir, 'theme', 'linkdir');
  const fresh = path.join(target, 'fresh.ts');
  const sheetPath = path.join(c.worldDir, '.reference-ui', 'styled', 'styles.css');
  const sheet = (): string => fs.readFileSync(sheetPath, 'utf8');

  fs.rmSync(link, { force: true });
  fs.rmSync(path.join(c.worldDir, 'shared'), { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
  fs.symlinkSync(path.join('..', 'shared', 'empty'), link, 'dir');
  try {
    await sync(c.worldDir);
    assert.doesNotMatch(sheet(), FRESH_RULE, 'baseline sheet has no fresh utility yet');

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
      fs.writeFileSync(fresh, FRESH_SOURCE);
      await waitFor(() => resyncs > before, 'resync after the new file in the symlinked target');
      assert.match(sheet(), FRESH_RULE, 'the new file in the symlinked target lands in the sheet');
      assert.ok(
        events.includes('add:theme/linkdir/fresh.ts'),
        `watcher reports the new file under the link path, saw [${events.join(', ')}]`,
      );
    } finally {
      await handle.stop();
    }
  } finally {
    fs.rmSync(fresh, { force: true });
    fs.unlinkSync(link);
    fs.rmSync(path.join(c.worldDir, 'shared'), { recursive: true, force: true });
    await sync(c.worldDir);
  }
}
