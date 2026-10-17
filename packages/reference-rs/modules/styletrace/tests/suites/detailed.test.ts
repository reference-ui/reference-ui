/**
 * Styletrace detailed-seam tests: bindings, coded diagnostics, and owned props.
 * Drives traceDetailed over scratch workspaces against the committed sync root,
 * pins the STT-W-SKIPPED-FILE and `owned` wire bytes exactly, and asserts both
 * refusal codes throw coded. The station suite pins names; this file pins the channel.
 */
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { traceDetailed } from '../../js/index.js'
import { createVirtualWorkspace } from '../../../../testing/index.js'

const TESTS_DIR = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const DEFAULT_SYNC_ROOT = path.resolve(TESTS_DIR, '../fixtures/sync-root')

const CARD = `import { Div, type StyleProps } from '@reference-ui/react'

export type CardProps = StyleProps & {
  title?: string
}

export function Card({ title, ...styleProps }: CardProps) {
  return <Div {...styleProps}>{title}</Div>
}
`

const FORWARDED_CARD = `import { Div, type StyleProps } from '@reference-ui/react'

export type CardProps = StyleProps & {
  id?: string
}

export function Card({ id, ...styleProps }: CardProps) {
  return <Div id={id} {...styleProps}>card</Div>
}
`

const REFLECTED_TILE = `import { Div, type StyleProps } from '@reference-ui/react'

export type TileProps = StyleProps & {
  size?: 'sm' | 'md' | 'lg'
}

export function Tile({ size, ...styleProps }: TileProps) {
  return <Div data-size={size} {...styleProps} />
}
`

const PLAIN = `import { Div, type StyleProps } from '@reference-ui/react'

export function Plain(props: StyleProps) {
  return <Div {...props} />
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

  it('reports the props a traced component keeps for itself as owned, with exact wire bytes', async () => {
    const workspace = await createVirtualWorkspace(
      { 'index.tsx': CARD },
      'styletrace-detailed-owned'
    )
    try {
      const result = await traceDetailed(workspace.rootDir, DEFAULT_SYNC_ROOT)
      expect(result.bindings.map(binding => binding.name)).toEqual(['Card'])
      expect(result.owned).toEqual({ Card: ['title'] })
      expect(JSON.stringify(result.owned)).toBe('{"Card":["title"]}')
    } finally {
      await workspace.cleanup()
    }
  })

  // A destructured prop stops being owned only when it reaches an element under the same prop name.
  it('drops a destructured prop from owned when it reaches an element under the same prop name', async () => {
    const workspace = await createVirtualWorkspace(
      { 'index.tsx': FORWARDED_CARD },
      'styletrace-detailed-owned-forwarded'
    )
    try {
      const result = await traceDetailed(workspace.rootDir, DEFAULT_SYNC_ROOT)
      expect(result.bindings.map(binding => binding.name)).toEqual(['Card'])
      expect(result.owned).toEqual({})
    } finally {
      await workspace.cleanup()
    }
  })

  it('keeps a destructured prop owned when it reaches an element under another name', async () => {
    const workspace = await createVirtualWorkspace(
      { 'index.tsx': REFLECTED_TILE },
      'styletrace-detailed-owned-reflected'
    )
    try {
      const result = await traceDetailed(workspace.rootDir, DEFAULT_SYNC_ROOT)
      expect(result.bindings.map(binding => binding.name)).toEqual(['Tile'])
      expect(result.owned).toEqual({ Tile: ['size'] })
      expect(JSON.stringify(result.owned)).toBe('{"Tile":["size"]}')
    } finally {
      await workspace.cleanup()
    }
  })

  it('reports owned as an empty object when no traced component keeps a prop', async () => {
    const workspace = await createVirtualWorkspace(
      { 'index.tsx': PLAIN },
      'styletrace-detailed-owned-none'
    )
    try {
      const result = await traceDetailed(workspace.rootDir, DEFAULT_SYNC_ROOT)
      expect(result.bindings.map(binding => binding.name)).toEqual(['Plain'])
      expect(result.owned).toEqual({})
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
