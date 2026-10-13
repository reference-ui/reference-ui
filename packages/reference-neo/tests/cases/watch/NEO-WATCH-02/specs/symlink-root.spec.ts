// symlink-root.spec.ts — spec for NEO-WATCH-02, the symlinked project root case.
// Takes { case } from the runner with the world freshly synced and asserts
// node-side. The watch starts through a symlink to the project, so the root it
// is given differs from the real paths parcel reports; a new css() file under
// theme/ must still resync into the sheet. Emits nothing on success; throws
// naming the missed resync on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync } from '../../../../../src/sync/index.ts';
import { watchSync } from '../../../../../src/lib/watch/index.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

const LATE = `import { css } from '@reference-ui/react'\n\nexport const late = css({ zIndex: 2201 })\n`;
const LATE_RULE = /__z_2201\s*\{\s*z-index:\s*2201/;

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

// The link is unlinked before its temp dir goes, so the world it points at is
// never followed or touched.
function removeAlias(alias: string, aliasDir: string): void {
  try {
    fs.unlinkSync(alias);
  } catch {
    // The link was never created, so there is nothing to unlink.
  }
  fs.rmSync(aliasDir, { recursive: true, force: true });
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  const latePath = path.join(c.worldDir, 'theme', 'late.ts');
  const sheetPath = path.join(c.worldDir, '.reference-ui', 'styled', 'styles.css');
  const sheet = (): string => fs.readFileSync(sheetPath, 'utf8');

  fs.rmSync(latePath, { force: true });
  const aliasDir = fs.mkdtempSync(path.join(os.tmpdir(), 'neo-watch-02-'));
  const alias = path.join(aliasDir, 'project');
  try {
    fs.symlinkSync(c.worldDir, alias, 'dir');
    await sync(c.worldDir);
    assert.doesNotMatch(sheet(), LATE_RULE, 'baseline sheet has no late utility yet');

    const events: string[] = [];
    let resyncs = 0;
    const handle = await watchSync(alias, {
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
      fs.writeFileSync(latePath, LATE);
      await waitFor(() => resyncs > before, 'resync after the addition through the symlinked root');
      assert.match(sheet(), LATE_RULE, 'added source lands in the sheet through the symlinked root');
      assert.ok(events.includes('add:theme/late.ts'), `watcher reports the addition, saw [${events.join(', ')}]`);
    } finally {
      await handle.stop();
    }
  } finally {
    fs.rmSync(latePath, { force: true });
    removeAlias(alias, aliasDir);
    await sync(c.worldDir);
  }
}
