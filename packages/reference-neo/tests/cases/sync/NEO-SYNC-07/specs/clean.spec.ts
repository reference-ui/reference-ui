// clean.spec.ts — spec for NEO-SYNC-07, the stale-files case. Takes { case }
// from the runner with the world freshly synced and asserts node-side.
// Emits nothing on success; throws naming the planted path that survives the
// resync, or the regenerated file missing after the clean, on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync } from '../../../../../src/sync/index.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

const PLANTED = ['stale-from-yesterday.txt', 'system/stale-module.mjs', 'nested/deep/junk.css'];

const REGENERATED = ['system/baseSystem.mjs', 'styled/styles.css', 'react/react.mjs'];

// The runner synced this world once before serving: plant stale files, sync
// again, and every planted path is gone while the inventory regenerates.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  for (const rel of PLANTED) {
    const full = path.join(outDir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, 'yesterday\n');
    assert.ok(fs.existsSync(full), `planted ${rel} before the resync`);
  }

  await sync(c.worldDir);

  for (const rel of PLANTED) {
    assert.ok(!fs.existsSync(path.join(outDir, rel)), `resync removes stale ${rel}`);
  }
  for (const rel of REGENERATED) {
    assert.ok(fs.existsSync(path.join(outDir, rel)), `resync regenerates ${rel}`);
  }
}
