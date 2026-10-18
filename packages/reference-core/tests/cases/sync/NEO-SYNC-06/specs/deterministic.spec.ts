// deterministic.spec.ts — spec for NEO-SYNC-06, the byte-identical resync case. Takes
// { case } from the runner with the world freshly synced and asserts node-side.
// Emits nothing on success; throws naming the first path whose bytes drift
// between two consecutive syncs, or the missing file when the folder is thin.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { sync } from '../../../../../src/sync/index.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// Every regular file under dir, recursive. Symlinks never resolve, so a link
// loop cannot hang the walk; dotfiles hash as bytes like everything else.
function walkFiles(dir: string, out: string[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, out);
    else if (entry.isFile()) out.push(full);
  }
}

// Sorted "relative-path:sha256" lines over the whole folder: one string that
// changes when any path appears, disappears, or drifts by a single byte.
function snapshotFolder(outDir: string): string[] {
  const files = [] as string[];
  walkFiles(outDir, files);
  files.sort();
  return files.map((file) => {
    const digest = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    return `${path.relative(outDir, file)}:${digest}`;
  });
}

// The runner synced this world once before serving: sync it twice more and
// the folder snapshots compare equal, proving consecutive syncs are stable.
export default async function run({ case: c }: SpecInput): Promise<void> {
  await sync(c.worldDir);
  const outDir = path.join(c.worldDir, '.reference-ui');
  const first = snapshotFolder(outDir);
  assert.ok(first.length >= 10, `synced folder holds the inventory, got ${first.length} files`);

  await sync(c.worldDir);
  const second = snapshotFolder(outDir);

  assert.deepEqual(second, first, 'two consecutive syncs produce byte-identical folders');
}
