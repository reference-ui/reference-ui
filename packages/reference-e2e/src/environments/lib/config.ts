/**
 * Environment-aware config helpers. Use during tests to add to the base ui.config
 * without overwriting other tests' changes. Base comes from the composed environment.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Base config from environments/base. Tests merge additions on top. */
const BASE_CONFIG = {
  name: 'reference-e2e',
  include: ['**/*.{ts,tsx}'] as const,
  debug: true,
  skipTypescript: true,
} as const

/** Key = config key, value = literal expression written to output. e.g. extends: '[baseSystem]' → extends: [baseSystem] */
export interface ConfigAdditions {
  name?: string
  include?: string[]
  debug?: boolean
  skipTypescript?: boolean
  /** Literal value for config.extends. e.g. '[baseSystem]' or '[]' */
  extends?: string
  /** Literal value for config.layers. e.g. '[baseSystem]' or '[]' */
  layers?: string
}

/** Resolve sandbox dir for the current test run. Requires REF_TEST_PROJECT. */
export function getSandboxDir(): string {
  const project = process.env.REF_TEST_PROJECT
  if (!project) throw new Error('REF_TEST_PROJECT required (set by run-matrix or run-quick)')
  const packageRoot = join(__dirname, '..', '..', '..')
  return join(packageRoot, '.sandbox', project)
}

function deepMerge<T extends object>(base: T, additions: Partial<T>): T {
  const result = { ...base }
  for (const key of Object.keys(additions) as (keyof T)[]) {
    const addVal = additions[key]
    if (addVal === undefined) continue
    const baseVal = result[key]
    if (
      typeof baseVal === 'object' &&
      baseVal !== null &&
      !Array.isArray(baseVal) &&
      typeof addVal === 'object' &&
      addVal !== null &&
      !Array.isArray(addVal)
    ) {
      ;(result as Record<string, unknown>)[key as string] = deepMerge(
        baseVal as object,
        addVal as object
      )
    } else {
      ;(result as Record<string, unknown>)[key as string] = addVal
    }
  }
  return result
}

const DEFAULT_BASESYSTEM_PKG = '@reference-ui/lib'
let initialSandboxConfigContent: string | null = null

/** Collect identifiers from expression like '[baseSystem]' → ['baseSystem'] */
function collectIdentifiers(expr: string): string[] {
  const matches = expr.matchAll(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g)
  return [...new Set([...matches].map((m) => m[1]))].filter((id) => id !== 'undefined' && id !== 'null')
}

/** Build ui.config.ts. extends/layers are literal string values; add imports for identifiers used. */
function buildConfigContent(merged: Record<string, unknown>, extendsExpr?: string, layersExpr?: string): string {
  const imports: string[] = ["import { defineConfig } from '@reference-ui/core'"]
  const configObj: Record<string, unknown> = { ...merged }
  delete configObj.extends
  delete configObj.layers

  const usedIds = new Set<string>()
  if (extendsExpr) collectIdentifiers(extendsExpr).forEach((id) => usedIds.add(id))
  if (layersExpr) collectIdentifiers(layersExpr).forEach((id) => usedIds.add(id))

  for (const id of usedIds) {
    if (id === 'baseSystem') {
      imports.push(`import { baseSystem } from '${DEFAULT_BASESYSTEM_PKG}'`)
      break
    }
  }

  const extras: string[] = []
  if (extendsExpr !== undefined) extras.push(`extends: ${extendsExpr}`)
  if (layersExpr !== undefined) extras.push(`layers: ${layersExpr}`)

  const configStr = JSON.stringify(configObj, null, 2)
  const suffix = extras.length ? ',\n  ' + extras.join(',\n  ') + '\n}' : '\n}'
  const configWithExtras = configStr.slice(0, -1) + suffix
  return `${imports.join('\n')}\n\nexport default defineConfig(${configWithExtras})`
}

async function getInitialSandboxConfigContent(): Promise<string> {
  if (initialSandboxConfigContent !== null) return initialSandboxConfigContent
  const sandboxDir = getSandboxDir()
  const configPath = join(sandboxDir, 'ui.config.ts')
  initialSandboxConfigContent = await readFile(configPath, 'utf-8')
  return initialSandboxConfigContent
}

/**
 * Add elements to the environment's base config and write to sandbox.
 * Merges additions onto base; never overwrites from other tests.
 */
export async function addToConfig(additions: ConfigAdditions): Promise<void> {
  const sandboxDir = getSandboxDir()
  await getInitialSandboxConfigContent()
  const { extends: extendsExpr = '[baseSystem]', layers: layersExpr, ...rest } = additions

  const merged = deepMerge(
    { ...BASE_CONFIG } as Record<string, unknown>,
    rest as Record<string, unknown>
  )

  const content = [
    `// e2e config write ${Date.now()}`,
    buildConfigContent(merged, extendsExpr, layersExpr),
  ].join('\n')
  const configPath = join(sandboxDir, 'ui.config.ts')
  await mkdir(dirname(configPath), { recursive: true })
  await writeFile(configPath, content)
}

export async function resetConfig(): Promise<void> {
  const sandboxDir = getSandboxDir()
  const configPath = join(sandboxDir, 'ui.config.ts')
  await writeFile(configPath, await getInitialSandboxConfigContent())
}
