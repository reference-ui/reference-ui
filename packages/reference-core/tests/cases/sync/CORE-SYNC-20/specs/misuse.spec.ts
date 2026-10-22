// misuse.spec.ts — spec for CORE-SYNC-20, extendSystem reached through @reference-ui/system. Takes { case } from
// the runner with the canonical world synced. It writes a config that imports extendSystem from the system id and
// asserts that sync rejects, naming that import. The canonical config is restored with a resync in a finally.
// Emits nothing on success; throws when the misuse syncs quietly or the rejection does not name the import.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { CoreCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync } from '../../../../../src/sync/index.ts';

interface SpecInput {
  page: SpecPage;
  case: CoreCase;
}

// The misuse rides as a string: the package typecheck covers every world file, so a world importing a missing
// export would redden the typecheck for every case. The override is exported, so the call is not dead code.
const MISUSE_CONFIG = [
  "import { defineConfig } from '@reference-ui/core'",
  "import { baseSystem, extendSystem } from '@reference-ui/system'",
  '',
  "export const themed = extendSystem(baseSystem, { tokens: { colors: { brand: { value: '#f00' } } } })",
  '',
  'export default defineConfig({',
  "  name: 'core-sync20',",
  "  include: ['theme/**/*.{ts,tsx}'],",
  '})',
  '',
].join('\n');

export default async function run({ case: c }: SpecInput): Promise<void> {
  const configPath = path.join(c.worldDir, 'ui.config.ts');
  const canonical = fs.readFileSync(configPath, 'utf8');
  try {
    fs.writeFileSync(configPath, MISUSE_CONFIG, 'utf8');
    await assert.rejects(
      sync(c.worldDir),
      /'@reference-ui\/system' does not provide an export named 'extendSystem'/,
      'extendSystem imported from @reference-ui/system fails sync, naming the import',
    );
  } finally {
    fs.writeFileSync(configPath, canonical, 'utf8');
    await sync(c.worldDir);
  }
}
