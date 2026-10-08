// include-scope.spec.ts — spec for NEO-SYNC-09, the include-glob scoping case. Takes
// { case } from the runner with the world freshly synced and asserts node-side.
// Emits nothing on success; throws naming the utility count or the include pin
// that drifts from the scoped scan on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// Non-overlapping occurrences of needle in haystack: split length minus one,
// so a missing utility counts zero without a regex escaping trap.
function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

// The runner synced this world before serving: the sheet carries the
// in-scope red utility while the outside-include blue file yields no
// utility, and compile-request.json pins the include globs sent.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');

  const request = JSON.parse(
    fs.readFileSync(path.join(outDir, 'system', 'compile-request.json'), 'utf8'),
  ) as { include: string[] };
  assert.deepEqual(request.include, ['theme/**'], 'frozen request carries the config include globs');

  const sheet = fs.readFileSync(path.join(outDir, 'styled', 'styles.css'), 'utf8');
  assert.equal(
    countOccurrences(sheet, 'neo-sync09__c_red'),
    1,
    'in-scope css() yields exactly one red utility',
  );
  assert.equal(
    countOccurrences(sheet, 'neo-sync09__c_blue'),
    0,
    'outside-include css() yields no blue utility',
  );
}
