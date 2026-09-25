// repro.spec.ts — spec for the ATM-W-UNKNOWN-BREAKPOINT case. Takes { case } from the
// runner with the world as-committed (the hook is off: warning and error
// fixtures compile by design) and asserts node-side. Emits nothing on
// success; throws when ATM-W-UNKNOWN-BREAKPOINT stops reproducing through the whole compiler.
import assert from 'node:assert/strict';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}
import { compileWorld } from '../../../../../src/diagnostics/repro-world.ts';

// The world carries the registry's minimal fixture for ATM-W-UNKNOWN-BREAKPOINT; compiling
// it through the whole compiler must surface the code on the compilerDiagnostics
// channel with warning severity and a non-blank message.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const result = await compileWorld(c.worldDir);
  const entries = (result.compilerDiagnostics ?? []);
  const found = entries.filter((entry) => entry.code === 'ATM-W-UNKNOWN-BREAKPOINT');
  assert.ok(found.length > 0, 'ATM-W-UNKNOWN-BREAKPOINT reproduces through the whole compiler');
  for (const entry of found) {
    assert.equal(entry.severity, 'warning');
    assert.ok(entry.message.trim().length > 0, 'the repro carries a non-blank message');
  }
}
