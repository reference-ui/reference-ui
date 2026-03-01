/**
 * Environment-aware config helpers. Use during tests to add to the base ui.config
 * without overwriting other tests' changes. Base comes from the composed environment.
 */

import { writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Base config from environments/base. Tests merge additions on top. */
const BASE_CONFIG = {
  name: 'reference-test',
  include: ['**/*.{ts,tsx}'] as const,
  debug: true,
  skipTypescript: true,
} as const

export interface ConfigAdditions {
  name?: string
  include?: string[]
  debug?: boolean
  skipTypescript?: boolean
  /** Package paths to import baseSystem from and add to extends. e.g. ['@reference-ui/lib'] */
  extendsFrom?: string[]
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

/** Build ui.config.ts content from merged config and optional extends imports. */
function buildConfigContent(merged: Record<string, unknown>, extendsFrom?: string[]): string {
  const imports: string[] = ["import { defineConfig } from '@reference-ui/core'"]
  const configObj: Record<string, unknown> = { ...merged }

  let extendsExpr = ''
  if (extendsFrom?.length) {
    const extendVars: string[] = []
    for (let i = 0; i < extendsFrom.length; i++) {
      const pkg = extendsFrom[i]
      const varName = i === 0 ? 'baseSystem' : `baseSystem${i}`
      imports.push(`import { baseSystem as ${varName} } from '${pkg}'`)
      extendVars.push(varName)
    }
    delete configObj.extends
    extendsExpr = `,\n  extends: [${extendVars.join(', ')}]`
  }

  const configStr = JSON.stringify(configObj, null, 2)
  const configWithExtends = configStr.slice(0, -1) + extendsExpr + '\n}'
  return `${imports.join('\n')}\n\nexport default defineConfig(${configWithExtends})`
}

/**
 * Add elements to the environment's base config and write to sandbox.
 * Merges additions onto base; never overwrites from other tests.
 */
export async function addToConfig(additions: ConfigAdditions): Promise<void> {
  const sandboxDir = getSandboxDir()
  const { extendsFrom, ...rest } = additions

  const merged = deepMerge(
    { ...BASE_CONFIG } as Record<string, unknown>,
    rest as Record<string, unknown>
  )

  const content = buildConfigContent(merged, extendsFrom)
  const configPath = join(sandboxDir, 'ui.config.ts')
  await mkdir(dirname(configPath), { recursive: true })
  await writeFile(configPath, content)
}
