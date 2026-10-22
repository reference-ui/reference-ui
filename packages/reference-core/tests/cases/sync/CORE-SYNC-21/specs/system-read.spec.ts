// system-read.spec.ts — spec for CORE-SYNC-21, a theme file reading baseSystem during sync. Takes { case } from the
// runner, which serves this world unsynced because it fails by design. It asserts that sync rejects with the named
// message and leaves no folder behind. Emits nothing on success; throws when sync resolves, when the rejection lacks
// the message, or when a half-written folder survives.
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

export default async function run({ case: c }: SpecInput): Promise<void> {
  await assert.rejects(
    sync(c.worldDir),
    /a theme file cannot read the system it is building; import upstream systems in ui\.config/,
    'a theme file that reads baseSystem fails sync with the named message',
  );
  assert.ok(
    !fs.existsSync(path.join(c.worldDir, '.reference-ui')),
    'the refused sync leaves no folder behind',
  );
}
