/**
 * Station specification for ATL-BOUND-01.
 * Writes four hostile shapes into scratch trees: a star cycle, a type cycle, two components that render each other, and a
 * twelve-module export-star clique that a page's unresolved import walks. Each tree is analyzed through the built atlas
 * analyzeDetailed in a child process, so a native fault or a runaway walk ends that child, not the Vitest worker.
 * Every shape must finish inside 1 s, Node startup included, and report the components, props and diagnostics pinned below.
 */
import { expect } from 'vitest'
import { createVirtualWorkspace, expectBounded, runIsolated, type IsolatedRun } from '../../../../../testing/index.js'
import type { AtlasAnalysisResult } from '../../../js/index.js'
import type { AtlasCaseSpec } from '../../harness/helpers.js'

const KILL_BUDGET_MS = 30_000
const TIME_BUDGET_MS = 1_000
const CLIQUE_SIZE = 12

const BUTTON = `import * as React from 'react'
export interface ButtonProps { variant?: 'solid' | 'ghost' }
export function Button(props: ButtonProps): React.ReactElement { return <button data-variant={props.variant} /> }
`

const USER_BADGE = `import * as React from 'react'
export interface BadgeProps { tone?: 'soft' }
export function UserBadge(props: BadgeProps): React.ReactElement { return <span data-tone={props.tone} /> }
`

const HOME = `import * as React from 'react'
import { Button, UserBadge } from '../components'
export function Home(): React.ReactElement { return <><Button variant="solid" /><UserBadge tone="soft" /></> }
`

const TYPE_CYCLE_BUTTON = `import * as React from 'react'
type X = Y & { a?: 'x' | 'y' }
type Y = X & { b?: string }
interface I extends J { c?: string }
interface J extends I {}
export type ButtonProps = X & I
export function Button(props: ButtonProps): React.ReactElement { return <button data-a={props.a} /> }
`

const MUTUAL_BUTTON = `import * as React from 'react'
import { UserBadge } from './UserBadge'
export interface ButtonProps { tone?: string }
export function Button(props: ButtonProps): React.ReactElement { return <UserBadge tone={props.tone} /> }
`

const MUTUAL_USER_BADGE = `import * as React from 'react'
import { Button } from './Button'
export interface BadgeProps { tone?: string }
export function UserBadge(props: BadgeProps): React.ReactElement { return <Button tone={props.tone} /> }
`

const MISSING_IMPORT_PAGE = `import * as React from 'react'
import { Missing } from '../components'
export function X(): React.ReactElement { return <Missing /> }
`

interface ComponentSummary {
  name: string
  count: number
  props: string[]
}

interface ShapeSummary {
  components: ComponentSummary[]
  codes: string[]
}

interface Shape {
  name: string
  files: Record<string, string>
  expected: ShapeSummary
}

/** A star cycle: index star-exports Button, UserBadge and more, and more star-exports index back. */
function starCycleFiles(): Record<string, string> {
  return {
    'src/components/Button.tsx': BUTTON,
    'src/components/UserBadge.tsx': USER_BADGE,
    'src/pages/Home.tsx': HOME,
    'src/components/index.ts': "export * from './Button'\nexport * from './UserBadge'\nexport * from './more'\n",
    'src/components/more.ts': "export * from './index'\n",
  }
}

/** A clique of twelve modules, each star-exporting the other eleven; the barrel re-exports Button, UserBadge and m0. */
function cliqueFiles(size: number): Record<string, string> {
  const files: Record<string, string> = {
    'src/components/Button.tsx': BUTTON,
    'src/components/UserBadge.tsx': USER_BADGE,
    'src/components/index.ts': "export * from './Button'\nexport * from './UserBadge'\nexport * from './m0'\n",
    'src/pages/X.tsx': MISSING_IMPORT_PAGE,
  }
  for (let i = 0; i < size; i++) {
    const lines: string[] = []
    for (let j = 0; j < size; j++) {
      if (j !== i) lines.push(`export * from './m${j}'`)
    }
    files[`src/components/m${i}.ts`] = `${lines.join('\n')}\n`
  }
  return files
}

const SHAPES: Shape[] = [
  {
    name: 'star cycle',
    files: starCycleFiles(),
    expected: {
      components: [
        { name: 'Button', count: 1, props: ['variant'] },
        { name: 'UserBadge', count: 1, props: ['tone'] },
      ],
      codes: [],
    },
  },
  {
    name: 'type cycle',
    files: {
      'src/components/Button.tsx': TYPE_CYCLE_BUTTON,
      'src/components/UserBadge.tsx': USER_BADGE,
      'src/pages/Home.tsx': HOME,
      'src/components/index.ts': "export { Button } from './Button'\nexport { UserBadge } from './UserBadge'\n",
    },
    expected: {
      components: [
        { name: 'Button', count: 1, props: ['a', 'b', 'c'] },
        { name: 'UserBadge', count: 1, props: ['tone'] },
      ],
      codes: [],
    },
  },
  {
    name: 'mutual components',
    files: {
      'src/components/Button.tsx': MUTUAL_BUTTON,
      'src/components/UserBadge.tsx': MUTUAL_USER_BADGE,
      'src/components/index.ts': "export { Button } from './Button'\nexport { UserBadge } from './UserBadge'\n",
    },
    expected: {
      components: [
        { name: 'Button', count: 1, props: ['tone'] },
        { name: 'UserBadge', count: 1, props: ['tone'] },
      ],
      codes: [],
    },
  },
  {
    name: 'twelve-module clique',
    files: cliqueFiles(CLIQUE_SIZE),
    expected: {
      components: [
        { name: 'Button', count: 0, props: ['variant'] },
        { name: 'UserBadge', count: 0, props: ['tone'] },
      ],
      codes: [],
    },
  },
]

/** Components and diagnostic codes in a stable order, so a shape compares by content rather than by walk order. */
function summarize(result: AtlasAnalysisResult): ShapeSummary {
  const components = result.components
    .map((component) => ({
      name: component.name,
      count: component.count,
      props: (component.props ?? []).map((prop) => prop.name).sort(),
    }))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  return { components, codes: result.diagnostics.map((diagnostic) => diagnostic.code).sort() }
}

async function checkShape(shape: Shape): Promise<void> {
  const workspace = await createVirtualWorkspace(shape.files, 'atlas-bound-01')
  try {
    const run = runIsolated<AtlasAnalysisResult>({
      module: 'atlas',
      fn: 'analyzeDetailed',
      args: [workspace.rootDir],
      timeoutMs: KILL_BUDGET_MS,
    })
    const result = boundedResult(shape, run)
    expect(summarize(result), shape.name).toEqual(shape.expected)
  } finally {
    await workspace.cleanup()
  }
}

function boundedResult(shape: Shape, run: IsolatedRun<AtlasAnalysisResult>): AtlasAnalysisResult {
  try {
    return expectBounded(run, { ms: TIME_BUDGET_MS })
  } catch (error) {
    throw new Error(`${shape.name}: ${(error as Error).message}`)
  }
}

const spec: AtlasCaseSpec = {
  id: 'ATL-BOUND-01',
  async verify(result) {
    expect(result.components.map((component) => component.name)).toEqual(['Button'])
    for (const shape of SHAPES) {
      await checkShape(shape)
    }
  },
}

export default spec
