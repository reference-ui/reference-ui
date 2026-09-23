import { afterEach, describe, expect, it } from 'vitest'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { resolveRefConfigFile } from './ref-config'

const TEMP_ROOT = join(import.meta.dirname, '__temp__-ref-config')
const CONFIG_TS = 'ui.config.ts'
const CONFIG_JS = 'ui.config.js'
const CONFIG_MJS = 'ui.config.mjs'

function createTestDir(name: string): string {
  const dir = join(TEMP_ROOT, name)
  mkdirSync(dir, { recursive: true })
  return dir
}

function writeConfig(dir: string, fileName: string): void {
  writeFileSync(join(dir, fileName), 'export default {}', 'utf-8')
}

afterEach(() => {
  rmSync(TEMP_ROOT, { recursive: true, force: true })
})

describe('resolveRefConfigFile', () => {
  it('prefers ui.config.ts over js and mjs', () => {
    const dir = createTestDir('prefers-ts')
    writeConfig(dir, CONFIG_MJS)
    writeConfig(dir, CONFIG_JS)
    writeConfig(dir, CONFIG_TS)

    expect(resolveRefConfigFile(dir)).toBe(join(dir, CONFIG_TS))
  })

  it('falls back to ui.config.js when ts is missing', () => {
    const dir = createTestDir('falls-back-js')
    writeConfig(dir, CONFIG_MJS)
    writeConfig(dir, CONFIG_JS)

    expect(resolveRefConfigFile(dir)).toBe(join(dir, CONFIG_JS))
  })

  it('falls back to ui.config.mjs when it is the only candidate', () => {
    const dir = createTestDir('falls-back-mjs')
    writeConfig(dir, CONFIG_MJS)

    expect(resolveRefConfigFile(dir)).toBe(join(dir, CONFIG_MJS))
  })

  it('returns null when no config file exists', () => {
    const dir = createTestDir('missing')

    expect(resolveRefConfigFile(dir)).toBeNull()
  })
})
