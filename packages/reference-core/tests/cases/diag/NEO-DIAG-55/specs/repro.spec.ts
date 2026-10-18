// repro.spec.ts — spec for the ATL-E-SCAN-FAILED case. Takes { case } from the
// runner with the world as-committed (the hook is off: analysis is driven
// by the spec) and asserts node-side. Emits nothing on success; throws
// when ATL-E-SCAN-FAILED stops reproducing through the whole analyzer.
import assert from 'node:assert/strict';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { analyzeDetailed as analyzeAtlasDetailed } from '@reference-ui/rust/atlas';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The world carries the registry's minimal app for ATL-E-SCAN-FAILED; analyzing it
// must surface the code with error severity and a non-blank message.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const result = await analyzeAtlasDetailed(c.worldDir, { rootDir: c.worldDir, ...{"exclude":["["]} });
  const found = result.diagnostics.filter((entry) => entry.code === 'ATL-E-SCAN-FAILED');
  assert.ok(found.length > 0, 'ATL-E-SCAN-FAILED reproduces through the analyzer');
  for (const entry of found) {
    assert.equal(entry.severity, 'error');
    assert.ok(entry.message.trim().length > 0, 'the repro carries a non-blank message');
  }
}
