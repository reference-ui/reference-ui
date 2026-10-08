// repro.spec.ts — spec for the TST-W-PARSE-ERROR case. Takes { case } from the
// runner with the world as-committed (the hook is off: the tasty build
// is driven by the spec) and asserts node-side. Emits nothing on success;
// throws when TST-W-PARSE-ERROR stops reproducing through the whole tasty compiler.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { buildTasty } from '@reference-ui/rust/tasty/build';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The world carries the registry's minimal workspace for TST-W-PARSE-ERROR;
// building it through the tasty compiler must surface the code with
// warning level and a non-blank message. Build output lands in a temp
// dir, never in the world.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const stored = path.join(c.worldDir, 'src/broken.ts.txt');
  const live = path.join(c.worldDir, 'src/broken.ts');
  fs.rmSync(live, { force: true });
  fs.copyFileSync(stored, live);
  try {
  const out = mkdtempSync(join(tmpdir(), 'neo-diag-'));
  try {
    const built = await buildTasty({ rootDir: c.worldDir, include: ['src/**/*.ts'], outputDir: out });
    const found = built.diagnostics.filter((entry) => entry.code === 'TST-W-PARSE-ERROR');
    assert.ok(found.length > 0, 'TST-W-PARSE-ERROR reproduces through the tasty compiler');
    for (const entry of found) {
      assert.equal(entry.level, 'warning');
      assert.ok(entry.message.trim().length > 0, 'the repro carries a non-blank message');
    }
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
  } finally {
    fs.rmSync(live, { force: true });
  }
}
