// loud.spec.ts — spec for NEO-SYNC-08, the loud-config-errors case. Takes
// { case } from the runner with the valid world freshly synced and asserts
// node-side. Emits nothing on success; throws naming the bad world that syncs
// quietly, or the rejection whose message names the wrong fault, on failure.
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

interface BadWorld {
  label: string;
  config: string;
  message: RegExp;
}

// Bad configs ride as strings: world files typecheck under the package
// tsconfig, so a type-invalid ui.config.ts cannot live in the world.
function configFile(body: string): string {
  return ['import { defineConfig } from \'@reference-ui/neo\'', '', 'export default defineConfig({', body, '})', ''].join(
    '\n',
  );
}

const BAD_WORLDS: BadWorld[] = [
  {
    label: 'missing include',
    config: configFile('  name: \'no-include\','),
    message: /must have an 'include' array/,
  },
  {
    label: 'missing name',
    config: configFile('  include: [\'theme/**/*.{ts,tsx}\'],'),
    message: /must have a non-empty 'name'/,
  },
  {
    label: 'unsafe name with double-quote',
    config: configFile('  name: \'bad"name\',\n  include: [\'theme/**/*.{ts,tsx}\'],'),
    message: /'name' is invalid/,
  },
  {
    label: 'unsafe name with newline',
    config: configFile('  name: \'bad\\nname\',\n  include: [\'theme/**/*.{ts,tsx}\'],'),
    message: /safe for CSS @layer/,
  },
  {
    label: 'non-array jsxElements',
    config: configFile('  name: \'bad-hosts\',\n  include: [\'theme/**/*.{ts,tsx}\'],\n  jsxElements: \'CardFrame\','),
    message: /'jsxElements' must be an array of strings/,
  },
  {
    label: 'non-string jsxElements entry',
    config: configFile(
      '  name: \'bad-hosts\',\n  include: [\'theme/**/*.{ts,tsx}\'],\n  jsxElements: [\'CardFrame\', 42],',
    ),
    message: /'jsxElements' must be an array of strings/,
  },
  {
    label: 'extends entry without synced data',
    config: configFile(
      '  name: \'bad-extends\',\n  include: [\'theme/**/*.{ts,tsx}\'],\n  extends: [{ name: \'upstream\' }],',
    ),
    message: /must include synced system data/,
  },
];

// The runner synced the valid world before serving: every bad world rejects
// with its documented message and leaves no folder behind.
export default async function run(_input: SpecInput): Promise<void> {
  for (const bad of BAD_WORLDS) {
    const dir = fs.mkdtempSync(path.join(tmpdir(), 'neo-sync8-'));
    try {
      fs.writeFileSync(path.join(dir, 'ui.config.ts'), bad.config);
      await assert.rejects(
        sync(dir),
        bad.message,
        `${bad.label} fails sync with the documented message`,
      );
      assert.ok(
        !fs.existsSync(path.join(dir, '.reference-ui')),
        `${bad.label} leaves no folder behind`,
      );
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
}
