// diagnostic.spec.ts — spec for NEO-SYNC-11, the failing-sync case. Takes
// { case } from the runner with the world UNSYNCED (the hook is off: the
// world fails by design) and asserts node-side. Emits nothing on success;
// throws when sync succeeds quietly, when the rejection lacks path:line, or
// when a half-written folder survives the failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync } from '../../../../../src/sync/index.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

function configFile(): string {
  return [
    'import { defineConfig } from \'@reference-ui/neo\'',
    '',
    'export default defineConfig({',
    '  name: \'warn-world\',',
    '  include: [\'theme/**/*.{ts,tsx}\'],',
    '})',
    '',
  ].join('\n');
}

const TOKENS_FILE = [
  'import { tokens } from \'@reference-ui/neo\'',
  '',
  'tokens({',
  '  colors: {',
  '    brand: { value: \'#7c3aed\' },',
  '  },',
  '})',
  '',
].join('\n');

// The runner served this world without syncing it: sync() rejects with the
// located ref error and no folder survives, while a display:true warning
// world syncs fine (warn-and-skip by engine design).
export default async function run({ case: c }: SpecInput): Promise<void> {
  await assert.rejects(
    sync(c.worldDir),
    /unknown token reference `\{colors\.nope\}`/,
    'missing token ref fails sync naming the ref',
  );
  await assert.rejects(
    sync(c.worldDir),
    /bad\.ts:3/,
    'missing token ref fails sync with path:line',
  );
  assert.ok(
    !fs.existsSync(path.join(c.worldDir, '.reference-ui')),
    'failed sync leaves no half-written folder behind',
  );

  const warnDir = fs.mkdtempSync(path.join(tmpdir(), 'neo-sync11-'));
  try {
    fs.mkdirSync(path.join(warnDir, 'theme'), { recursive: true });
    fs.writeFileSync(path.join(warnDir, 'ui.config.ts'), configFile());
    fs.writeFileSync(path.join(warnDir, 'theme', 'tokens.ts'), TOKENS_FILE);
    fs.writeFileSync(
      path.join(warnDir, 'theme', 'warn.ts'),
      'import { css } from \'@reference-ui/react\'\n\nexport const cls = css({ display: true })\n',
    );
    await sync(warnDir);
    assert.ok(
      fs.existsSync(path.join(warnDir, '.reference-ui', 'styled', 'styles.css')),
      'display:true warns and sync succeeds',
    );
  } finally {
    fs.rmSync(warnDir, { recursive: true, force: true });
  }
}
