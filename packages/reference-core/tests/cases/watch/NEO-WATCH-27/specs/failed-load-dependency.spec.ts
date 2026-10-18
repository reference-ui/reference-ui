// failed-load-dependency.spec.ts — spec for NEO-WATCH-27, a config dependency created after a failed load. Takes { case }
// from the runner and drives watchSync() in-process over a temp world. The config imports a helper that does not exist
// yet: the load must fail and report it. The helper is then created with a wider include, and that create must resync
// the watch so the accent in the newly included dir reaches the sheet. Emits nothing on success; throws naming the
// missing leg on failure. The watch stops and the temp world is removed in a finally.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync } from '../../../../../src/sync/index.ts';
import { watchSync } from '../../../../../src/lib/watch/index.ts';
import { disposeWorld, makeWorld, sleep } from '../../shared/commit-world.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

const WAIT_MS = 20000;
const BASE_INCLUDE = "export const include = ['theme/**/*.{ts,tsx}']\n";
const WIDENED_INCLUDE = "export const include = ['theme/**/*.{ts,tsx}', 'extra/**/*.{ts,tsx}']\n";
const EXTRA_FRAGMENT = [
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

function configImporting(helper: string): string {
  return [
    "import { defineConfig } from '@reference-ui/neo'",
    `import { include } from '${helper}'`,
    '',
    'export default defineConfig({',
    "  name: 'neo-watch-27',",
    '  include,',
    '})',
    '',
  ].join('\n');
}

// Poll until cond holds or the budget burns; the failure names the leg that never happened.
async function waitFor(cond: () => boolean, label: string): Promise<void> {
  const deadline = Date.now() + WAIT_MS;
  while (!cond()) {
    assert.ok(Date.now() < deadline, `timed out waiting for ${label}`);
    await sleep(100);
  }
}

export default async function run(_input: SpecInput): Promise<void> {
  const dir = makeWorld();
  try {
    const configPath = path.join(dir, 'ui.config.ts');
    const sheetPath = path.join(dir, '.reference-ui', 'styled', 'styles.css');
    fs.mkdirSync(path.join(dir, 'config'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'config', 'include.ts'), BASE_INCLUDE);
    fs.writeFileSync(configPath, configImporting('./config/include.ts'));
    await sync(dir);

    let resyncs = 0;
    const failures: string[] = [];
    const handle = await watchSync(dir, {
      onResync: () => {
        resyncs += 1;
      },
      onError: (error) => {
        failures.push(error.message);
      },
    });
    try {
      // The config now imports a helper that is not on disk: the load fails and the watch reports it.
      fs.writeFileSync(configPath, configImporting('./config/extra-include.ts'));
      await waitFor(
        () => failures.some((message) => message.includes('extra-include')),
        'the failed load to name the missing helper'
      );
      await sleep(300);

      // The newly included dir and its fragment exist before the helper, so the helper's create is the save that
      // must resync. Only a watch that kept the failed load's imports in scope sees it.
      fs.mkdirSync(path.join(dir, 'extra'), { recursive: true });
      fs.writeFileSync(path.join(dir, 'extra', 'tokens.ts'), EXTRA_FRAGMENT);
      fs.writeFileSync(path.join(dir, 'config', 'extra-include.ts'), WIDENED_INCLUDE);
      await waitFor(() => resyncs > 0, 'a resync for the helper created after the failed load');
      assert.match(fs.readFileSync(sheetPath, 'utf8'), ACCENT, 'the resync reads the helper, so its include reaches the sheet');
    } finally {
      await handle.stop();
    }
  } finally {
    disposeWorld(dir);
  }
}
