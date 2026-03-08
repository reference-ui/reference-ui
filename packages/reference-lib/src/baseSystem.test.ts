import { describe, it, expect, beforeAll } from 'vitest'
import { execSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import { REF_LIB_CANARY } from './colors.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..')

describe('baseSystem', () => {
  beforeAll(() => {
    execSync('ref sync', {
      cwd: pkgRoot,
      stdio: 'pipe',
    })
  }, 30_000)

  it('emits baseSystem to .reference-ui/system after ref sync', () => {
    const baseSystemPath = resolve(pkgRoot, '.reference-ui', 'system', 'baseSystem.mjs')
    expect(existsSync(baseSystemPath), `baseSystem.mjs should exist at ${baseSystemPath}`).toBe(true)
  })

  it('reference-lib public entry exports the generated baseSystem', async () => {
    const { baseSystem } = await import('./index.ts')

    expect(baseSystem).toBeDefined()
    expect(baseSystem.name).toBe('reference-ui')
    expect(typeof baseSystem.fragment).toBe('string')
    expect(baseSystem.fragment).toContain('refLibCanary')
    expect(baseSystem.fragment).toContain(REF_LIB_CANARY)
  })
})
