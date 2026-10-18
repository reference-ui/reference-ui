// dir-move.spec.ts — spec for NEO-WATCH-03, the directory move case. Takes
// { case } from the runner with the world freshly synced and asserts node-side.
// A directory holding one css() file starts outside include, moves into theme/
// under a live watch, and moves back out; each move must resync and the sheet
// must follow it. Emits nothing on success; throws naming the missed resync on
// failure.
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

const BOXED = `import { css } from '@reference-ui/react'\n\nexport const boxed = css({ zIndex: 3301 })\n`;
const BOXED_RULE = /__z_3301\s*\{\s*z-index:\s*3301/;

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

function removeTree(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  const outside = path.join(c.worldDir, 'box');
  const inside = path.join(c.worldDir, 'theme', 'box');
  const sheetPath = path.join(c.worldDir, '.reference-ui', 'styled', 'styles.css');
  const sheet = (): string => fs.readFileSync(sheetPath, 'utf8');

  removeTree(outside);
  removeTree(inside);
  fs.mkdirSync(outside, { recursive: true });
  fs.writeFileSync(path.join(outside, 'a.ts'), BOXED);
  await sync(c.worldDir);
  assert.doesNotMatch(sheet(), BOXED_RULE, 'baseline sheet has no boxed utility while the directory sits outside include');

  const events: string[] = [];
  let resyncs = 0;
  const handle = await watchSync(c.worldDir, {
    onChange: (change) => events.push(`${change.event}:${change.relativePath.replaceAll('\\', '/')}`),
    onResync: () => {
      resyncs += 1;
    },
  });
  try {
    // Let the subscriptions go fully live before the first mutation.
    await sleep(500);

    let before = resyncs;
    fs.renameSync(outside, inside);
    await waitFor(() => resyncs > before, 'resync after the directory moved into include');
    assert.match(sheet(), BOXED_RULE, 'directory moved into include resyncs its class into the sheet');
    assert.ok(
      events.some((entry) => entry.endsWith(':theme/box') || entry.includes(':theme/box/')),
      `watcher reports the move into include, saw [${events.join(', ')}]`,
    );

    before = resyncs;
    fs.renameSync(inside, outside);
    await waitFor(() => resyncs > before, 'resync after the directory moved out of include');
    assert.doesNotMatch(sheet(), BOXED_RULE, 'directory moved out of include drops its class from the sheet');
  } finally {
    await handle.stop();
    removeTree(outside);
    removeTree(inside);
    await sync(c.worldDir);
  }
}
