// repro.spec.ts — spec for the TGN-W-UNKNOWN-TOKEN-CATEGORY case. Takes { case } from the
// runner with the world as-committed (the hook is off: the print is driven
// by the spec) and asserts node-side. Emits nothing on success; throws
// when TGN-W-UNKNOWN-TOKEN-CATEGORY stops reproducing through the whole printer.
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

// The world carries the registry's minimal spec for TGN-W-UNKNOWN-TOKEN-CATEGORY as spec.json;
// printing it must surface the code with warning severity and a non-blank
// message.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const spec = JSON.parse(fs.readFileSync(path.join(c.worldDir, 'spec.json'), 'utf8'));
  const result = emitDtsDetailed({ baseSystem: spec });
  const found = result.diagnostics.filter((entry) => entry.code === 'TGN-W-UNKNOWN-TOKEN-CATEGORY');
  assert.ok(found.length > 0, 'TGN-W-UNKNOWN-TOKEN-CATEGORY reproduces through the printer');
  for (const entry of found) {
    assert.equal(entry.severity, 'warning');
    assert.ok(entry.message.trim().length > 0, 'the repro carries a non-blank message');
  }
}
