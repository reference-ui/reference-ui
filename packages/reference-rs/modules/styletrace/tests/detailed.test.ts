/**
 * Styletrace detailed-seam tests: bindings plus coded diagnostics.
 * Drives traceDetailed over scratch workspaces against the committed sync root,
 * pins the STT-W-SKIPPED-FILE wire bytes exactly, and asserts both refusal
 * codes throw coded. The station suite pins names; this file pins the channel.
 */
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { traceDetailed } from '../js/index'
import { createVirtualWorkspace } from '../../../testing/index.js'

const TESTS_STYLETRACE_DIR = fileURLToPath(new URL('.', import.meta.url))
const DEFAULT_SYNC_ROOT = path.resolve(TESTS_STYLETRACE_DIR, '../fixtures/sync-root')

const CARD = `import { Div, type StyleProps } from '@reference-ui/react'

export type CardProps = StyleProps & {
  title?: string
}

export function Card({ title, ...styleProps }: CardProps) {
  return <Div {...styleProps}>{title}</Div>
}
`

const BROKEN = 'export function Broken( {\n'

describe('styletrace detailed', () => {
  it('reports an unparsable sibling as STT-W-SKIPPED-FILE with exact wire bytes', async () => {
    const workspace = await createVirtualWorkspace(
      { 'index.tsx': CARD, 'broken.tsx': BROKEN },
      'styletrace-detailed-skip'
    )
    try {
      const result = await traceDetailed(workspace.rootDir, DEFAULT_SYNC_ROOT)
      expect(result.bindings.map(binding => binding.name)).toEqual(['Card'])
      const broken = path.join(workspace.rootDir, 'broken.tsx')
      const message = `StyleTrace: failed to parse ${broken}: 1 parse error(s)`
      expect(result.diagnostics).toEqual([
        {
          severity: 'warning',
          code: 'STT-W-SKIPPED-FILE',
          message,
          file: broken,
        },
      ])
      expect(JSON.stringify(result.diagnostics)).toBe(
        `[{"severity":"warning","code":"STT-W-SKIPPED-FILE",` +
          `"message":"${message}","file":"${broken}"}]`
      )
    } finally {
      await workspace.cleanup()
    }
  })

  it('refuses an unreadable source root with STT-E-SCAN-FAILED', async () => {
    const workspace = await createVirtualWorkspace(
      { 'index.tsx': CARD },
      'styletrace-detailed-scan'
    )
    try {
      await expect(
        traceDetailed(path.join(workspace.rootDir, 'nonexistent-src'), DEFAULT_SYNC_ROOT)
      ).rejects.toThrow('STT-E-SCAN-FAILED')
    } finally {
      await workspace.cleanup()
    }
  })

  it('refuses a declaration root without entrypoints with STT-E-UNRESOLVED-SURFACE', async () => {
    const workspace = await createVirtualWorkspace(
      { 'index.tsx': CARD },
      'styletrace-detailed-surface'
    )
    try {
      await expect(
        traceDetailed(workspace.rootDir, path.join(workspace.rootDir, 'empty-decl'))
      ).rejects.toThrow('STT-E-UNRESOLVED-SURFACE')
    } finally {
      await workspace.cleanup()
    }
  })
})
