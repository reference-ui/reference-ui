/**
 * Atlas nesting-gate pin (ATL-W-SKIPPED-FILE). A source file nested past the nesting gate is refused before Oxc parses it,
 * so the analysis reports one ATL-W-SKIPPED-FILE located at that file, with the line where the nesting crossed the limit,
 * and its sibling still analyzes. The analysis runs in a child process through runIsolated, so a native fault or a runaway
 * walk ends that child, not the Vitest worker.
 */
import { describe, expect, it } from 'vitest'

import { createVirtualWorkspace, expectBounded, runIsolated } from '../../../../testing/index.js'
import type { AtlasAnalysisResult } from '../../js/index.js'

const DEEP_SOURCE = `export const deep = ${'('.repeat(1100)}1${')'.repeat(1100)}\n`
const CARD_SOURCE = `import * as React from 'react'
export interface CardProps { tone?: 'soft' }
export function Card(props: CardProps): React.ReactElement { return <span data-tone={props.tone} /> }
`

describe('atlas nesting gate', () => {
  it('reports the refused file at its path and line, and keeps the sibling component', async () => {
    const workspace = await createVirtualWorkspace(
      { 'src/deep.ts': DEEP_SOURCE, 'src/components/Card.tsx': CARD_SOURCE },
      'atlas-nesting'
    )
    try {
      const run = runIsolated<AtlasAnalysisResult>({
        module: 'atlas',
        fn: 'analyzeDetailed',
        args: [workspace.rootDir],
        timeoutMs: 30_000,
      })
      const result = expectBounded(run, { ms: 2000 })

      const skipped = result.diagnostics.filter(d => d.code === 'ATL-W-SKIPPED-FILE')
      expect(skipped).toHaveLength(1)
      expect(skipped[0]!.file).toBe('src/deep.ts')
      expect(skipped[0]!.line).toBe(1)
      expect(skipped[0]!.message).toBe(
        'nesting deeper than 1024 levels at line 1; split or flatten the deeply nested expression'
      )
      expect(result.components.map(component => component.name)).toContain('Card')
    } finally {
      await workspace.cleanup()
    }
  })
})
