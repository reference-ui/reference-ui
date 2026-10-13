// extra-fragment.spec.ts — spec for NEO-WATCH-13, the failed-scope case. Takes { case } from the runner with the world
// freshly synced and drives watchSync() in-process. A config that widens include to extra/ plus a throwing fragment there
// must report the failure, and the fix saved into that dir must resync the watch and reach the sheet. Emits nothing on
// success; throws naming the missing leg on failure. The config, the fragment and extra/ are restored in a finally.
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

const WAIT_MS = 30000;
const WIDENED_CONFIG = [
  "import { defineConfig } from '@reference-ui/neo'",
  '',
  'export default defineConfig({',
  "  name: 'neo-watch-13',",
  "  include: ['theme/**/*.{ts,tsx}', 'extra/**/*.{ts,tsx}'],",
  '})',
  '',
].join('\n');
const FAILING_FRAGMENT = ["import { tokens } from '@reference-ui/neo'", "throw new Error('extra-boom')", ''].join('\n');
const FIXED_FRAGMENT = [
  "import { tokens } from '@reference-ui/neo'",
  '',
  'tokens({',
  '  colors: {',
  "    accent: { value: '#0e5c3f' },",
  '  },',
  '})',
  '',
].join('\n');
const ACCENT = /--colors-accent:\s*#0e5c3f/i;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Poll until cond holds or the budget burns; the failure names the leg that never happened.
async function waitFor(cond: () => boolean, label: string): Promise<void> {
  const deadline = Date.now() + WAIT_MS;
  while (!cond()) {
    assert.ok(Date.now() < deadline, `timed out waiting for ${label}`);
    await sleep(100);
  }
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  const configPath = path.join(c.worldDir, 'ui.config.ts');
  const extraDir = path.join(c.worldDir, 'extra');
  const fragment = path.join(extraDir, 'tokens.ts');
  const sheetPath = path.join(c.worldDir, '.reference-ui', 'styled', 'styles.css');
  const originalConfig = fs.readFileSync(configPath, 'utf8');

  await sync(c.worldDir);
  let resyncs = 0;
  const failures: string[] = [];
  const handle = await watchSync(c.worldDir, {
    onResync: () => {
      resyncs += 1;
    },
    onError: (error) => {
      failures.push(error.message);
    },
  });
  try {
    // The config adds extra/ to include and the fragment there throws while it loads.
    fs.mkdirSync(extraDir, { recursive: true });
    fs.writeFileSync(fragment, FAILING_FRAGMENT);
    fs.writeFileSync(configPath, WIDENED_CONFIG);
    await waitFor(() => failures.some((message) => message.includes('extra-boom')), 'the failing fragment to report');
    await sleep(300);

    // The fix is saved into the newly included dir. Only a rebuilt trigger scope sees that save.
    fs.writeFileSync(fragment, FIXED_FRAGMENT);
    await waitFor(() => resyncs > 0, 'a resync for the fix saved in the newly included dir');
    assert.match(fs.readFileSync(sheetPath, 'utf8'), ACCENT, 'the resync that the fix caused reaches the sheet');
  } finally {
    await handle.stop();
    fs.writeFileSync(configPath, originalConfig);
    fs.rmSync(extraDir, { recursive: true, force: true });
    await sync(c.worldDir);
  }
}
