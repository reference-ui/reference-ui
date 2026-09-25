// repro.spec.ts — spec for the ATM-E-CONFLICTING-SCAN-INPUTS case. Takes { case } from the
// runner with the world as-committed (the hook is off: the request is
// mutated by design) and asserts node-side. Emits nothing on success;
// throws when ATM-E-CONFLICTING-SCAN-INPUTS stops reproducing through native compile.
import assert from 'node:assert/strict';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { compileNative } from '../../../../../src/native/compile.ts';
import { releaseScanRetention } from '../../../../../src/native/retention.ts';
import { prepareDiagWorld } from '../../diag-request.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// No authored fixture raises ATM-E-CONFLICTING-SCAN-INPUTS alone, so the spec applies the
// registry-documented request mutation to the case world, compiles for
// real, and asserts the code with error severity on the diagnostics.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const world = await prepareDiagWorld(c.worldDir);
  try {
    if (world.prepared.retentionToken === undefined) {
      throw new Error('native retention unavailable: cannot stage conflicting scan inputs')
    }
    world.request.files = [{ path: 'theme/tokens.ts', content: 'export {}\n' }]
    world.request.retentionToken = world.prepared.retentionToken
    const result = await compileNative(world.request);
    const found = result.diagnostics.filter((entry) => entry.code === 'ATM-E-CONFLICTING-SCAN-INPUTS');
    assert.ok(found.length > 0, 'ATM-E-CONFLICTING-SCAN-INPUTS reproduces through native compile');
    for (const entry of found) {
      assert.equal(entry.severity, 'error');
      assert.ok(entry.message.trim().length > 0, 'the repro carries a non-blank message');
    }
  } finally {
    await releaseScanRetention(world.prepared.retentionToken);
  }
}
