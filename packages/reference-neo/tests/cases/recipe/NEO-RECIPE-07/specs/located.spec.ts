// located.spec.ts — spec for NEO-RECIPE-07, the non-literal case. Takes
// { case } from the runner with the world UNSYNCED (the hook is off: the
// world fails by design) and asserts node-side. Emits nothing on success;
// throws when sync succeeds quietly, when the refusal lacks file/line/
// column, or when a half-written folder survives the failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync } from '../../../../../src/sync/index.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The runner served this world without syncing it: the identifier-fed
// recipe() fails sync with the located inline-literal refusal naming the
// offending call's file, line, and column, and no folder survives.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const failure: unknown = await sync(c.worldDir).then(
    () => null,
    (err: unknown) => err,
  );
  assert.ok(failure instanceof Error, 'non-literal recipe fails sync');
  const message = failure instanceof Error ? failure.message : String(failure);
  assert.match(
    message,
    /requires an inline object literal/,
    'the rejection names the inline-literal refusal',
  );
  assert.match(message, /app\.ts:8:\d+/, 'the rejection carries file:line:column');
  assert.ok(
    !fs.existsSync(path.join(c.worldDir, '.reference-ui')),
    'failed sync leaves no half-written folder behind',
  );
}
