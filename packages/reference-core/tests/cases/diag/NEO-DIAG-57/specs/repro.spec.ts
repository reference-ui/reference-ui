// repro.spec.ts — spec for the STT-E-SCAN-FAILED case. Takes { case } from the
// runner with the world as-committed and asserts node-side. Emits nothing
// on success; throws when the refusal stops throwing as STT-E-SCAN-FAILED.
import assert from 'node:assert/strict';
import { join } from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { traceDetailed } from '@reference-ui/rust/styletrace';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The styletrace refusal throws coded instead of riding a payload: tracing
// a missing source root must reject naming STT-E-SCAN-FAILED.
export default async function run({ case: c }: SpecInput): Promise<void> {
  await assert.rejects(
    traceDetailed(join(c.worldDir, 'nonexistent-src'), join(c.worldDir, 'decl')),
    /STT-E-SCAN-FAILED/
  );
}
