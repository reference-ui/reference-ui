import { describe, it, expect, beforeAll } from 'vitest'
import { execSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

/**
 * Canary token defined in src/styled/theme/canary.ts.
 * We scan the generated baseSystem for this to verify reference-lib tokens are included.
 */
const CANARY_VALUE = 'oklch(50% 0.2 180)'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..')

describe('baseSystem', () => {
  beforeAll(() => {
    execSync('ref sync', {
      cwd: pkgRoot,
      stdio: 'pipe',
    })
  }, 30_000)

  it('emits baseSystem to @reference-ui/system after ref sync', () => {
    const baseSystemPath = resolve(pkgRoot, 'node_modules', '@reference-ui', 'system', 'baseSystem.mjs')
    expect(existsSync(baseSystemPath), `baseSystem.mjs should exist at ${baseSystemPath}`).toBe(true)
  })

  it('baseSystem contains our canary token from reference-lib', async () => {
    const { baseSystem } = await import('@reference-ui/system/baseSystem')

    expect(baseSystem).toBeDefined()
    expect(baseSystem.name).toBe('reference-ui')

    const canary = baseSystem.tokens?.colors?.refLibCanary

    expect(canary, `baseSystem should contain refLibCanary token from src/styled/theme/canary.ts`).toBeDefined()
    expect(canary?.value).toBe(CANARY_VALUE)
  })
})
