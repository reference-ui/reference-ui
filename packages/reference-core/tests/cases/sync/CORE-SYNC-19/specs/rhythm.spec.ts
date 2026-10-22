// rhythm.spec.ts — spec for CORE-SYNC-19, getRhythm from @reference-ui/system at sync. Takes { page, case } from
// the runner with the world freshly synced and asserts node-side. Emits nothing on success; throws naming the
// missing gap rule or the stylesheet on failure.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import type { CoreCase } from '../../../../shared/cases.ts'
import type { SpecPage } from '../../../../shared/page.ts'

interface SpecInput {
  page: SpecPage
  case: CoreCase
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui')
  const sheet = fs.readFileSync(path.join(outDir, 'styled', 'styles.css'), 'utf8')
  assert.ok(
    sheet.includes('--gap: calc(2 * var(--spacing-root))'),
    `sheet carries the theme's getRhythm(2) gap, got ${sheet.slice(0, 200)}`,
  )
}
