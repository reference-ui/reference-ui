// bare-upstream.spec.ts — spec for CORE-WATCH-28, a bare-specifier upstream that re-syncs. Takes { case } from the runner
// and drives watchSync() in-process over temp trees. Two legs run in turn: a linked upstream, reached through a symlink
// in the consumer's node_modules, and an installed upstream, a real directory there. Each leg syncs the upstream and the
// consumer, starts the watch, re-syncs the upstream alone with a new ink, and requires a consumer resync whose sheet
// carries the new ink and not the old one. Emits nothing on success; throws naming the failed leg on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import type { CoreCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync } from '../../../../../src/sync/index.ts';
import { watchSync } from '../../../../../src/lib/watch/index.ts';
import { disposeWorld, makeWorld, sleep } from '../../shared/commit-world.ts';

interface SpecInput {
  page: SpecPage;
  case: CoreCase;
}

const UP = 'core-watch-28-up';
const INK_V1 = '#be185d';
const INK_V2 = '#0f766e';
const WAIT_MS = 30000;

// Where the upstream lives for a leg. Linked: a sibling tree, reached through a relative symlink. Installed: a real
// directory under the consumer's node_modules, the way a package install lays it out.
interface Leg {
  name: 'linked' | 'installed';
  placeUpstream(app: string, root: string): string;
}

const LEGS: Leg[] = [
  {
    name: 'linked',
    placeUpstream(app, root) {
      const upDir = path.join(root, 'upstream');
      fs.mkdirSync(upDir, { recursive: true });
      const link = path.join(app, 'node_modules', UP);
      fs.mkdirSync(path.dirname(link), { recursive: true });
      fs.symlinkSync(path.relative(path.dirname(link), upDir), link, 'dir');
      return upDir;
    },
  },
  {
    name: 'installed',
    placeUpstream(app) {
      const upDir = path.join(app, 'node_modules', UP);
      fs.mkdirSync(upDir, { recursive: true });
      return upDir;
    },
  },
];

function inkDecl(ink: string): string {
  return `--colors-up-ink: ${ink}`;
}

function sheetOf(app: string): string {
  return fs.readFileSync(path.join(app, '.reference-ui', 'styled', 'styles.css'), 'utf8');
}

function publishedOf(upDir: string): string {
  return fs.readFileSync(path.join(upDir, '.reference-ui', 'system', 'baseSystem.mjs'), 'utf8');
}

function upstreamPackage(): string {
  return `${JSON.stringify(
    {
      name: UP,
      private: true,
      type: 'module',
      exports: {
        './baseSystem': {
          types: './.reference-ui/system/baseSystem.d.mts',
          import: './.reference-ui/system/baseSystem.mjs',
        },
      },
    },
    null,
    2
  )}\n`;
}

function upstreamConfig(): string {
  return [
    "import { defineConfig } from '@reference-ui/core'",
    '',
    'export default defineConfig({',
    `  name: '${UP}',`,
    "  include: ['theme/**/*.{ts,tsx}'],",
    '})',
    '',
  ].join('\n');
}

function upstreamTokens(ink: string): string {
  return ["import { tokens } from '@reference-ui/core'", '', 'tokens({', '  colors: {', `    upInk: { value: '${ink}' },`, '  },', '})', ''].join('\n');
}

function consumerConfig(): string {
  return [
    "import { defineConfig } from '@reference-ui/core'",
    `import { baseSystem } from '${UP}/baseSystem'`,
    '',
    'export default defineConfig({',
    "  name: 'core-watch-28-app',",
    "  include: ['theme/**/*.{ts,tsx}'],",
    '  extends: [baseSystem],',
    '})',
    '',
  ].join('\n');
}

function writeUpstream(upDir: string, ink: string): void {
  fs.writeFileSync(path.join(upDir, 'package.json'), upstreamPackage());
  fs.writeFileSync(path.join(upDir, 'ui.config.ts'), upstreamConfig());
  fs.mkdirSync(path.join(upDir, 'theme'), { recursive: true });
  fs.writeFileSync(path.join(upDir, 'theme', 'tokens.ts'), upstreamTokens(ink));
}

// Poll until cond holds or the budget burns; the failure names the leg that never happened.
async function waitFor(cond: () => boolean, label: string): Promise<void> {
  const deadline = Date.now() + WAIT_MS;
  while (!cond()) {
    assert.ok(Date.now() < deadline, `timed out waiting for ${label}`);
    await sleep(100);
  }
}

async function runLeg(leg: Leg): Promise<void> {
  const app = makeWorld();
  const root = fs.realpathSync(fs.mkdtempSync(path.join(tmpdir(), 'core-watch-28-')));
  try {
    const upDir = leg.placeUpstream(app, root);
    writeUpstream(upDir, INK_V1);
    await sync(upDir);
    fs.writeFileSync(path.join(app, 'ui.config.ts'), consumerConfig());
    await sync(app);
    assert.ok(sheetOf(app).includes(inkDecl(INK_V1)), `${leg.name}: the consumer carries the v1 ink on its first sync`);

    let resyncs = 0;
    const failures: string[] = [];
    const handle = await watchSync(app, {
      onResync: () => {
        resyncs += 1;
      },
      onError: (error) => {
        failures.push(error.message);
      },
    });
    try {
      // The upstream re-syncs alone: the consumer's sync is never run in this leg, so only the watch can land it.
      writeUpstream(upDir, INK_V2);
      await sync(upDir);
      assert.ok(publishedOf(upDir).includes(inkDecl(INK_V2)), `${leg.name}: the upstream publishes the v2 ink`);
      await waitFor(() => resyncs > 0, `a consumer resync after the ${leg.name} upstream re-synced`);
      assert.deepEqual(failures, [], `${leg.name}: the consumer resync does not fail`);
      const sheet = sheetOf(app);
      assert.ok(sheet.includes(inkDecl(INK_V2)), `${leg.name}: the consumer resync carries the v2 ink`);
      assert.ok(!sheet.includes(inkDecl(INK_V1)), `${leg.name}: the consumer resync drops the v1 ink`);
    } finally {
      await handle.stop();
    }
  } finally {
    disposeWorld(app);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

export default async function run(_input: SpecInput): Promise<void> {
  const failed: string[] = [];
  for (const leg of LEGS) {
    try {
      await runLeg(leg);
    } catch (error) {
      failed.push(error instanceof Error ? error.message : String(error));
    }
  }
  assert.deepEqual(failed, [], failed.join('\n'));
}
