// doubled-slash.spec.ts: spec for CORE-SYNC-18, the doubled-slash sync root case. Takes { case } with the
// world synced through its plain path by the runner, and reads that stylesheet as the control. It then
// calls sync() on the same world spelled with `//` before its last segment and reads the stylesheet again.
// Emits nothing on success; throws naming the spelling and the class count when the doubled-slash sync misses the include's class.
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

const INCLUDE_CLASS = 'core-sync18__c_red';

// The same directory spelled with `//` before its last segment: a root a caller may pass as-is.
function doubledSlashSpelling(worldDir: string): string {
  return worldDir.replace(/\/(?=[^/]+$)/, '//');
}

// Non-overlapping occurrences of needle in haystack, so a missing class counts zero.
function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

function readStyles(worldDir: string): string {
  return fs.readFileSync(path.join(worldDir, '.reference-ui', 'styled', 'styles.css'), 'utf8');
}

// The runner synced this world through its plain path before serving, so the first read is the control.
// The doubled-slash sync of the same directory must paint the include's class exactly once as well.
export default async function run({ case: c }: SpecInput): Promise<void> {
  assert.equal(
    countOccurrences(readStyles(c.worldDir), INCLUDE_CLASS),
    1,
    'control: the plain path paints the include class exactly once',
  );
  const doubled = doubledSlashSpelling(c.worldDir);
  await sync(doubled);
  assert.equal(
    countOccurrences(readStyles(doubled), INCLUDE_CLASS),
    1,
    `sync of ${doubled} paints the include class exactly once`,
  );
}
