// repro.spec.ts — spec for the STT-W-SKIPPED-FILE case. Takes { case } from the
// runner with the world as-committed (the hook is off: the trace is driven
// by the spec) and asserts node-side. Emits nothing on success; throws
// when STT-W-SKIPPED-FILE stops reproducing through the whole tracer.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { join } from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { traceDetailed } from '@reference-ui/rust/styletrace';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The world stores the unparseable sibling as src/broken.tsx.txt (tsc skips
// non-TS); the spec materializes it around the trace. Tracing must surface
// STT-W-SKIPPED-FILE on the broken file while AppCard still binds from its sibling.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const stored = path.join(c.worldDir, 'src/broken.tsx.txt');
  const live = path.join(c.worldDir, 'src/broken.tsx');
  fs.rmSync(live, { force: true });
  fs.copyFileSync(stored, live);
  try {
    const result = await traceDetailed(join(c.worldDir, 'src'), join(c.worldDir, 'decl'));
    const found = result.diagnostics.filter((entry) => entry.code === 'STT-W-SKIPPED-FILE');
    assert.ok(found.length > 0, 'STT-W-SKIPPED-FILE reproduces through the tracer');
    for (const entry of found) {
      assert.equal(entry.severity, 'warning');
      assert.ok(entry.message.trim().length > 0, 'the repro carries a non-blank message');
      assert.match(entry.file ?? '', /broken\.tsx$/, 'the skip names the broken file');
    }
    assert.ok(
      result.bindings.map((binding) => binding.name).includes('AppCard'),
      'AppCard still binds past the skipped file'
    );
  } finally {
    fs.rmSync(live, { force: true });
  }
}
