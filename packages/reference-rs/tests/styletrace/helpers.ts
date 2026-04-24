import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import { trace } from '../../js/styletrace'

const TESTS_STYLETRACE_DIR = fileURLToPath(new URL('.', import.meta.url))
const REFERENCE_RS_DIR = path.resolve(TESTS_STYLETRACE_DIR, '..', '..')
const WORKSPACE_ROOT = path.resolve(REFERENCE_RS_DIR, '..', '..')
const DEFAULT_SYNC_ROOT = path.join(WORKSPACE_ROOT, 'packages', 'reference-lib')

export function getCaseInputDir(caseName: string): string {
  return path.join(TESTS_STYLETRACE_DIR, 'cases', caseName, 'input')
}

export async function traceCase(caseName: string): Promise<string[]> {
  return trace(getCaseInputDir(caseName), DEFAULT_SYNC_ROOT)
}

export async function traceDir(rootDir: string): Promise<string[]> {
  return trace(rootDir, DEFAULT_SYNC_ROOT)
}

export async function traceDirWithHint(rootDir: string, syncRootHint: string): Promise<string[]> {
  return trace(rootDir, syncRootHint)
}

export async function traceDirWithoutHint(rootDir: string): Promise<string[]> {
  return trace(rootDir)
}

export function getWorkspaceFixtureDir(relativePath: string): string {
  return path.join(REFERENCE_RS_DIR, '..', '..', relativePath)
}

export async function traceFixtureDir(relativePath: string): Promise<string[]> {
  return trace(getWorkspaceFixtureDir(relativePath), DEFAULT_SYNC_ROOT)
}

export interface RuntimeFixture {
  rootDir: string
  cleanup: () => Promise<void>
}

export async function createNodeModulesWrapperFixture(): Promise<RuntimeFixture> {
  return createRuntimeFixture('node-modules-wrapper', {
    'index.tsx': `import { PackageCard, type PackageCardProps } from 'fixture-style-lib'

export type AppCardProps = PackageCardProps

export function AppCard(props: AppCardProps) {
  return <PackageCard {...props} />
}

export { PackageCard } from 'fixture-style-lib'
`,
    'node_modules/fixture-style-lib/index.tsx': `import { Div, type StyleProps } from '@reference-ui/react'

export interface PackageCardProps extends StyleProps {
  tone?: 'neutral' | 'brand'
}

export function PackageCard({ tone = 'neutral', ...styleProps }: PackageCardProps) {
  return <Div data-tone={tone} {...styleProps} />
}
`,
  })
}

export async function createDefaultExportPackageFixture(): Promise<RuntimeFixture> {
  return createRuntimeFixture('default-export-package', {
    'index.tsx': `import type { StyleProps } from '@reference-ui/react'
import DefaultCard from 'fixture-style-default'

export type AppCardProps = StyleProps & {
  title?: string
}

export function AppCard(props: AppCardProps) {
  return <DefaultCard {...props} />
}

export { default as PackageCard } from 'fixture-style-default'
`,
    'node_modules/fixture-style-default/package.json': `{
  "name": "fixture-style-default",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./index.tsx"
  }
}
`,
    'node_modules/fixture-style-default/index.tsx': `import { Div, type StyleProps } from '@reference-ui/react'

export type DefaultCardProps = StyleProps & {
  title?: string
}

export default function DefaultCard({ title, ...styleProps }: DefaultCardProps) {
  return <Div {...styleProps}>{title}</Div>
}
`,
  })
}

export async function createSubpathPackageFixture(): Promise<RuntimeFixture> {
  return createRuntimeFixture('subpath-package', {
    'index.tsx': `import { PackageCard, type PackageCardProps } from 'fixture-style-subpath/card'

export type AppCardProps = PackageCardProps

export function AppCard(props: AppCardProps) {
  return <PackageCard {...props} />
}

export { PackageCard } from 'fixture-style-subpath/card'
`,
    'node_modules/fixture-style-subpath/package.json': `{
  "name": "fixture-style-subpath",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    "./card": "./card.tsx"
  }
}
`,
    'node_modules/fixture-style-subpath/card.tsx': `import { Div, type StyleProps } from '@reference-ui/react'

export type PackageCardProps = StyleProps & {
  title?: string
}

export function PackageCard({ title, ...styleProps }: PackageCardProps) {
  return <Div {...styleProps}>{title}</Div>
}
`,
  })
}

export async function createExportStarPackageFixture(): Promise<RuntimeFixture> {
  return createRuntimeFixture('export-star-package', {
    'index.tsx': `import { PackageCard, type PackageCardProps } from 'fixture-style-barrel'

export type AppCardProps = PackageCardProps

export function AppCard(props: AppCardProps) {
  return <PackageCard {...props} />
}

export { PackageCard } from 'fixture-style-barrel'
`,
    'node_modules/fixture-style-barrel/package.json': `{
  "name": "fixture-style-barrel",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./index.ts"
  }
}
`,
    'node_modules/fixture-style-barrel/index.ts': `export * from './card'
`,
    'node_modules/fixture-style-barrel/card.tsx': `import { Div, type StyleProps } from '@reference-ui/react'

export type PackageCardProps = StyleProps & {
  title?: string
}

export function PackageCard({ title, ...styleProps }: PackageCardProps) {
  return <Div {...styleProps}>{title}</Div>
}
`,
  })
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

export async function createSyncedWorkspaceFixture(): Promise<RuntimeFixture & { syncRootHint: string }> {
  const scratchBaseDir = path.join(tmpdir(), 'reference-rs-styletrace-synced')
  await mkdir(scratchBaseDir, { recursive: true })
  const rootDir = await mkdtemp(path.join(scratchBaseDir, 'reference-rs-styletrace-synced-workspace-'))

  const fixture = await writeRuntimeFixture(rootDir, {
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
    syncRootHint: path.join(rootDir, 'consumer-app'),
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

async function createRuntimeFixture(
  name: string,
  files: Record<string, string>,
): Promise<RuntimeFixture> {
  const scratchBaseDir = path.join(WORKSPACE_ROOT, 'target', 'styletrace-js-tests')
  await mkdir(scratchBaseDir, { recursive: true })
  const rootDir = await mkdtemp(path.join(scratchBaseDir, `reference-rs-styletrace-${name}-`))

  return writeRuntimeFixture(rootDir, files)
}

async function writeRuntimeFixture(
  rootDir: string,
  files: Record<string, string>,
): Promise<RuntimeFixture> {

  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = path.join(rootDir, relativePath)
    await mkdir(path.dirname(filePath), { recursive: true })
    await writeFile(filePath, content, 'utf8')
  }

  return {
    rootDir,
    cleanup: async () => {
      await rm(rootDir, { recursive: true, force: true })
    },
  }
}