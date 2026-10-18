// repro.spec.ts — spec for the ATM-W-UNKNOWN-TONE case. Takes { case } from the
// runner with the world as-committed (the hook is off: warning and error
// fixtures compile by design) and asserts node-side. Emits nothing on
// success; throws when ATM-W-UNKNOWN-TONE stops reproducing through the whole compiler.
import assert from 'node:assert/strict';
import type { CoreCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: CoreCase;
}
import { compileWorld } from '../../../../../src/diagnostics/tests/repro-world.ts';

// The world declares `medium` and styles `brand/mediun`; compiling it through
// the whole compiler must surface the code on the diagnostics channel with
// warning severity, and the message must name the tone the author misspelled.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const result = await compileWorld(c.worldDir);
  const entries = result.diagnostics;
  const found = entries.filter((entry) => entry.code === 'ATM-W-UNKNOWN-TONE');
  assert.ok(found.length > 0, 'ATM-W-UNKNOWN-TONE reproduces through the whole compiler');
  for (const entry of found) {
    assert.equal(entry.severity, 'warning');
    assert.ok(entry.message.trim().length > 0, 'the repro carries a non-blank message');
  }
  assert.ok(
    found.some((entry) => entry.message.includes('mediun')),
    'the repro message names the unknown tone'
  );
}
