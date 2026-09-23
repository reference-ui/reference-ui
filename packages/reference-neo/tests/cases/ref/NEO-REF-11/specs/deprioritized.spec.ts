// deprioritized.spec.ts — spec for NEO-REF-11, the tasty deprioritization proof. Takes { case } with the
// world freshly synced, then re-syncs and asserts the perf-law ordering node-side. Emits nothing on success;
// throws naming the ordering or the drifted path when tasty stops trailing sync on failure.
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type { NeoCase } from '../../../../shared/cases.ts'
import type { SpecPage } from '../../../../shared/page.ts'
import { sync } from '../../../../../src/sync/index.ts'
import { getReferenceManifestPath } from '../../../../../src/reference/bridge/index.ts'
import { waitForReferenceReady } from '../../shared/ref-world.ts'

interface SpecInput {
  page: SpecPage
  case: NeoCase
}

// Every regular file under dir, recursive, except the session-owned tasty subtree.
// Symlinks never resolve, so a link loop cannot hang the walk (SYNC-06 posture).
function walkSyncFiles(dir: string, tastyDir: string, out: string[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (full === tastyDir || full.startsWith(`${tastyDir}${path.sep}`)) continue
    if (entry.isDirectory()) walkSyncFiles(full, tastyDir, out)
    else if (entry.isFile()) out.push(full)
  }
}

// Sorted relative-path-plus-sha256 lines over the sync-owned folder: one value that moves when any
// sync-emitted byte drifts. The tasty/ subtree is excluded — it is background-owned and asserted separately.
function snapshotSyncOutput(outDir: string): string[] {
  const files: string[] = []
  walkSyncFiles(outDir, path.join(outDir, 'types', 'tasty'), files)
  files.sort()
  return files.map((file) => {
    const digest = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
    return `${path.relative(outDir, file)}:${digest}`
  })
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  await waitForReferenceReady(c.worldDir)
  const outDir = path.join(c.worldDir, '.reference-ui')
  const before = snapshotSyncOutput(outDir)
  assert.ok(before.length >= 10, `synced folder holds the inventory, got ${before.length} files`)

  // The perf-law ordering: sync-complete (await returned) lands before tasty-manifest-ready.
  // The check runs synchronously in the continuation — no await may sit between the sync and the stat.
  await sync(c.worldDir)
  const manifestPath = getReferenceManifestPath(c.worldDir)
  assert.ok(!fs.existsSync(manifestPath), 'sync-complete lands before tasty-manifest-ready')
  await waitForReferenceReady(c.worldDir)
  assert.ok(fs.existsSync(manifestPath), 'the background loop restores the manifest after')

  // Tasty trailing behind never perturbs the sync-owned bytes.
  const after = snapshotSyncOutput(outDir)
  assert.deepEqual(after, before, 're-sync output is byte-identical outside the background-owned tasty dir')
}
