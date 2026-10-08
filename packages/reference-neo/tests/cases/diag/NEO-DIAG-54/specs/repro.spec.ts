// repro.spec.ts — spec for the ATL-W-UNRESOLVED-INCLUDE-PACKAGE case. Takes { case } from the
// runner with the world as-committed (the hook is off: analysis is driven
// by the spec) and asserts node-side. Emits nothing on success; throws
// when ATL-W-UNRESOLVED-INCLUDE-PACKAGE stops reproducing through the whole analyzer.
import assert from 'node:assert/strict';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { analyzeDetailed as analyzeAtlasDetailed } from '@reference-ui/rust/atlas';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The world carries the registry's minimal app for ATL-W-UNRESOLVED-INCLUDE-PACKAGE; analyzing it
// must surface the code with warning severity and a non-blank message.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const result = await analyzeAtlasDetailed(c.worldDir, { rootDir: c.worldDir, ...{"include":["@fixtures/missing-ui"]} });
  const found = result.diagnostics.filter((entry) => entry.code === 'ATL-W-UNRESOLVED-INCLUDE-PACKAGE');
  assert.ok(found.length > 0, 'ATL-W-UNRESOLVED-INCLUDE-PACKAGE reproduces through the analyzer');
  for (const entry of found) {
    assert.equal(entry.severity, 'warning');
    assert.ok(entry.message.trim().length > 0, 'the repro carries a non-blank message');
  }
}
