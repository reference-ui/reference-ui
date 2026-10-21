// missing-ref.spec.ts — spec for CORE-TOKEN-02, the missing-ref case. Takes
// { case } from the runner with the world UNSYNCED (the hook is off: the
// world fails by design) and asserts node-side. Emits nothing on success;
// throws when sync succeeds quietly, when the rejection lacks the ref or
// path:line, or when a half-written folder survives the failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { CoreCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync } from '../../../../../src/sync/index.ts';

interface SpecInput {
  page: SpecPage;
  case: CoreCase;
}

// bad.ts opens with a `//` header that also quotes the ref, so the helper
// skips comment lines and returns the code line carrying it. Deriving the
// line keeps the path:line pin true when the fixture header grows.
function badRefLine(worldDir: string): number {
  const lines = fs.readFileSync(path.join(worldDir, 'theme', 'bad.ts'), 'utf8').split('\n');
  const index = lines.findIndex(
    (line) => line.includes('{colors.nope}') && !line.trimStart().startsWith('//'),
  );
  assert.notEqual(index, -1, 'bad.ts carries a code line with the {colors.nope} ref');
  return index + 1;
}

// The runner served this world without syncing it: the embedded missing
// ref fails sync with a located error naming the ref, never Panda's
// escaped literal and never a ghost var, and no folder survives.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const refLine = badRefLine(c.worldDir);
  const failure: unknown = await sync(c.worldDir).then(
    () => null,
    (err: unknown) => err,
  );
  assert.ok(failure instanceof Error, 'missing token ref fails sync');
  const message = failure instanceof Error ? failure.message : String(failure);
  assert.match(
    message,
    /unknown token reference `\{colors\.nope\}`/,
    'the rejection names the missing ref',
  );
  assert.match(
    message,
    new RegExp(`bad\\.ts:${refLine}\\b`),
    'the rejection carries path:line',
  );
  assert.doesNotMatch(
    message,
    /colors\\.nope/,
    'the rejection never escapes the ref Panda-style',
  );
  assert.doesNotMatch(
    message,
    /var\(--colors-nope\)/,
    'the rejection never mints a ghost var',
  );
  assert.ok(
    !fs.existsSync(path.join(c.worldDir, '.reference-ui')),
    'failed sync leaves no half-written folder behind',
  );
}
