/**
 * Virtual-source station (ATM-SITE-90). Card and Badge arrive as virtual
 * sources, so no style trace reads them: Card's props type fails to parse on
 * disk and Badge's props are inline. The spec compiles the virtual files alone
 * (a small compile) and again past the 64-file lane threshold; both must agree
 * on traced hosts and diagnostics.
 */
import path from 'node:path'
import { expect } from 'vitest'
import type { AtomicCaseSpec } from '../../harness/helpers.js'
import { compileCase, getCaseInputDir } from '../../harness/helpers.js'
import type { VirtualSource } from '../../../js/types.js'

const CASE_ID = 'ATM-SITE-90'

const CARD = `import { Div } from '@reference-ui/react'
import type { CardProps } from './types'
export function Card(props: CardProps) {
  return <Div {...props} />
}
`

const BADGE = `import { Div } from '@reference-ui/react'
export function Badge(props: { mt?: string; label?: string }) {
  return <Div {...props} />
}
`

const PAGE = `import { Card } from './Card'
import { Badge } from './Badge'
export function Page() {
  return <div><Card mt="4r" /><Badge mt="4r" /></div>
}
`

/** Styling files past the 64-file front threshold: imports only, no wants. */
function fillers(srcDir: string): VirtualSource[] {
  return Array.from({ length: 70 }, (_, index) => ({
    path: path.join(srcDir, 'fill', `F${index}.ts`),
    content: `import type { StyleProps } from '@reference-ui/react'\nexport const F${index} = 'f${index}'\n`,
  }))
}

const spec: AtomicCaseSpec = {
  id: CASE_ID,
  async verify() {
    const srcDir = path.join(getCaseInputDir(CASE_ID), 'src')
    const virtual: VirtualSource[] = [
      { path: path.join(srcDir, 'Card.tsx'), content: CARD },
      { path: path.join(srcDir, 'Badge.tsx'), content: BADGE },
      { path: path.join(srcDir, 'Page.tsx'), content: PAGE },
    ]
    const small = await compileCase(CASE_ID, { files: virtual })
    const crowded = await compileCase(CASE_ID, { files: [...virtual, ...fillers(srcDir)] })

    expect(small.tracedJsxHosts ?? [], 'no virtual wrapper is a traced host').toEqual([])
    expect(crowded.tracedJsxHosts ?? [], 'the lane compile traces the same hosts').toEqual(
      small.tracedJsxHosts ?? []
    )
    expect(crowded.diagnostics, 'the lane compile reports the same diagnostics').toEqual(
      small.diagnostics
    )
  },
}

export default spec
