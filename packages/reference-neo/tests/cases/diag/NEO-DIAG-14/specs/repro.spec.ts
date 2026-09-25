// repro.spec.ts — spec for the ATM-W-TRACE-SKIPPED case. Takes { case } from the
// runner with the world as-committed (the hook is off: the broken fixture
// compiles by design) and asserts node-side. Emits nothing on success;
// throws when ATM-W-TRACE-SKIPPED stops reproducing through the whole compiler.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { compileWorld } from '../../../../../src/diagnostics/repro-world.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The world stores the unparseable fixture as theme/broken.tsx.txt (tsc skips
// non-TS); the spec materializes the live path around the compile and
// removes it in a finally, so the tree never keeps a red file behind.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const stored = path.join(c.worldDir, 'theme/broken.tsx.txt');
  const live = path.join(c.worldDir, 'theme/broken.tsx');
  fs.rmSync(live, { force: true });
  fs.copyFileSync(stored, live);
  try {
    const result = await compileWorld(c.worldDir);
    const entries = result.diagnostics;
    const found = entries.filter((entry) => entry.code === 'ATM-W-TRACE-SKIPPED');
    assert.ok(found.length > 0, 'ATM-W-TRACE-SKIPPED reproduces through the whole compiler');
    for (const entry of found) {
      assert.equal(entry.severity, 'warning');
      assert.ok(entry.message.trim().length > 0, 'the repro carries a non-blank message');
    }
  } finally {
    fs.rmSync(live, { force: true });
  }
}
