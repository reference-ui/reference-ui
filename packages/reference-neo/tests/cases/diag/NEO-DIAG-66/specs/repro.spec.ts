// repro.spec.ts — spec for the TGN-E-INVALID-BASE-SYSTEM case. Takes { case } from the
// runner with the world as-committed and asserts node-side. Emits nothing
// on success; throws when the bad schema version stops refusing as TGN-E-INVALID-BASE-SYSTEM.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { emitDtsDetailed } from '@reference-ui/rust/typegen';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The spec refusal throws coded instead of riding a payload: printing a
// base system with a bad schema version must throw naming TGN-E-INVALID-BASE-SYSTEM.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const spec = JSON.parse(fs.readFileSync(path.join(c.worldDir, 'spec.json'), 'utf8'));
  assert.throws(() => emitDtsDetailed({ baseSystem: spec }), /TGN-E-INVALID-BASE-SYSTEM/);
}
