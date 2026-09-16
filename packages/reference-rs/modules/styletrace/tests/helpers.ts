/**
 * Styletrace station helpers: discovery, VirtualWorkspace compile, goldens, and leftover fixtures.
 * Each station's committed `input/` is copied into a scratch tree, remapping `packages/` to
 * `node_modules/` so mock libraries stay git-trackable. Tracing always uses the workspace
 * `packages/reference-lib` sync root. Synced consumer roots and repo-level fixtures still
 * build ephemeral trees here; they are not case stations.
 */
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import { expect } from 'vitest'

import { trace } from '../js/index'
import {
  createVirtualWorkspace,
  type GoldenDefinition,
  type StandingGauge,
  type StationContext,
  type StationSpec,
} from '../../../testing/index.js'

const TESTS_STYLETRACE_DIR = fileURLToPath(new URL('.', import.meta.url))
const REFERENCE_RS_DIR = path.resolve(TESTS_STYLETRACE_DIR, '../../..')
const WORKSPACE_ROOT = path.resolve(REFERENCE_RS_DIR, '../..')
const DEFAULT_SYNC_ROOT = path.resolve(TESTS_STYLETRACE_DIR, '../fixtures/sync-root')

export const CASES_DIR = path.resolve(TESTS_STYLETRACE_DIR, 'cases')
export const CASE_FOLDER = /^([a-z][a-z0-9_]*)$/

export type StyletraceResult = string[]
export type StyletraceCaseSpec = StationSpec<StyletraceResult>

export async function compileStyletraceCase(
  ctx: StationContext
): Promise<StyletraceResult> {
  const files = collectStationFiles(ctx.inputDir)
  const workspace = await createVirtualWorkspace(files, `styletrace-${ctx.caseName}`)
  try {
    return await trace(workspace.rootDir, DEFAULT_SYNC_ROOT)
  } finally {
    await workspace.cleanup()
  }
}

export const styletraceGoldens: GoldenDefinition<StyletraceResult>[] = [
  {
    fileName: 'components.json',
    format: 'json',
    extract: names => [...names].sort(),
  },
]

export const styletraceGauges: StandingGauge<StyletraceResult>[] = [
  names => {
    expect(names, 'traced component names must be unique').toHaveLength(
      new Set(names).size
    )
    expect(names, 'traced component names must be sorted').toEqual([...names].sort())
  },
]

export async function traceDir(rootDir: string): Promise<string[]> {
  return trace(rootDir, DEFAULT_SYNC_ROOT)
}

export async function traceDirWithHint(
  rootDir: string,
  syncRootHint: string
): Promise<string[]> {
  return trace(rootDir, syncRootHint)
}

export async function traceDirWithoutHint(rootDir: string): Promise<string[]> {
  return trace(rootDir)
}

export function getWorkspaceFixtureDir(relativePath: string): string {
  return path.join(WORKSPACE_ROOT, relativePath)
}

export async function traceFixtureDir(relativePath: string): Promise<string[]> {
  return trace(getWorkspaceFixtureDir(relativePath), DEFAULT_SYNC_ROOT)
}

export interface RuntimeFixture {
  rootDir: string
  cleanup: () => Promise<void>
}

export async function createNodeBuiltinHelperFixture(): Promise<RuntimeFixture> {
  return createRuntimeFixture('node-builtin-helper', {
    'index.tsx': `import { resolveLabel } from './helpers'
import { Div, type StyleProps } from '@reference-ui/react'

export interface AppCardProps extends StyleProps {
  label?: string
}

export function AppCard({ label = 'Card', ...styleProps }: AppCardProps) {
  return <Div data-label={resolveLabel(label)} {...styleProps} />
}
`,
    'helpers.ts': `import { join } from 'node:path'

export function resolveLabel(label: string) {
  return join('ui', label)
}
`,
  })
}

export async function createSyncedWorkspaceFixture(): Promise<
  RuntimeFixture & { syncRootHint: string }
> {
  const fixture = await createRuntimeFixture('synced', {
    'consumer-app/src/index.tsx': `import { Div } from '@reference-ui/react'

export interface AppCardProps {
  color?: string
  title?: string
}

export function AppCard({ title, ...styleProps }: AppCardProps) {
  return <Div {...styleProps}>{title}</Div>
}
`,
    'consumer-app/.reference-ui/react/package.json': `{
  "name": "@reference-ui/react",
  "types": "./react.d.mts"
}
`,
    'consumer-app/.reference-ui/react/react.d.mts': `export * from './entry/react'
`,
    'consumer-app/.reference-ui/react/entry/react.d.mts': `export { Div, type StyleProps } from '../types/index.d.mts'
`,
    'consumer-app/.reference-ui/react/types/index.d.mts': `export { Div } from '../system/primitives/index.d.mts'
export type { StyleProps } from './style-props.d.mts'
`,
    'consumer-app/.reference-ui/react/types/style-props.d.mts': `export type StyleProps = {
  color?: string
}
`,
    'consumer-app/.reference-ui/react/system/primitives/index.d.mts': `declare const Div: (props: unknown) => unknown
export { Div }
`,
    'consumer-app/.reference-ui/styled/package.json': `{
  "name": "@reference-ui/styled",
  "types": "./types/index.d.ts"
}
`,
    'consumer-app/.reference-ui/styled/types/index.d.ts': `export type {} from './system-types'
`,
    'consumer-app/.reference-ui/styled/types/system-types.d.ts': `export interface CssVarProperties {}
export type CssVarKeys = never
`,
  })

  return {
    ...fixture,
    syncRootHint: path.join(fixture.rootDir, 'consumer-app'),
  }
}

export async function createReactReexportFixture(): Promise<RuntimeFixture> {
  return createRuntimeFixture('react-reexport', {
    'index.tsx': `import { Div, type StyleProps } from './reference'

export type AppCardProps = StyleProps & {
  title?: string
}

export function AppCard({ title, ...styleProps }: AppCardProps) {
  return <Div {...styleProps}>{title}</Div>
}
`,
    'reference.ts': `export { Div } from '@reference-ui/react'
export type { StyleProps } from '@reference-ui/react'
`,
  })
}

function collectStationFiles(inputDir: string): Record<string, string> {
  const files: Record<string, string> = {}
  walkStationInput(inputDir, '', files)
  return files
}

function walkStationInput(dir: string, rel: string, files: Record<string, string>): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const childRel = rel ? `${rel}/${entry.name}` : entry.name
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkStationInput(full, childRel, files)
      continue
    }
    files[remapPackagesToNodeModules(childRel)] = fs.readFileSync(full, 'utf-8')
  }
}

function remapPackagesToNodeModules(rel: string): string {
  return rel.startsWith('packages/')
    ? `node_modules/${rel.slice('packages/'.length)}`
    : rel
}

async function createRuntimeFixture(
  name: string,
  files: Record<string, string>
): Promise<RuntimeFixture> {
  const ws = await createVirtualWorkspace(files, `styletrace-${name}`)
  return {
    rootDir: ws.rootDir,
    cleanup: async () => {
      await ws.cleanup()
    },
  }
}
