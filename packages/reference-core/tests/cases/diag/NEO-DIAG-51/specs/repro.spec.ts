// repro.spec.ts — spec for the TST-E-SCAN-FAILED case. Takes { case } from the
// runner with the world as-committed and asserts node-side. Emits nothing
// on success; throws when the invalid glob stops refusing as TST-E-SCAN-FAILED.
import assert from 'node:assert/strict';
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

// The scan refusal throws coded instead of riding a payload: an invalid
// glob must reject naming TST-E-SCAN-FAILED. Build output lands in a temp dir.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const out = mkdtempSync(join(tmpdir(), 'neo-diag-'));
  try {
    await assert.rejects(
      buildTasty({ rootDir: c.worldDir, include: ['['], outputDir: out }),
      /TST-E-SCAN-FAILED/
    );
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}
