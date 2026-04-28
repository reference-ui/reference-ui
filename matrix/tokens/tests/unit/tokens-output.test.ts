import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(__dirname, '..', '..')
const refUiDir = join(packageRoot, '.reference-ui')
const pandaConfigPath = join(refUiDir, 'panda.config.ts')
const stylesPath = join(refUiDir, 'react', 'styles.css')

describe('tokens output', () => {
  it('generates panda.config.ts', () => {
    expect(existsSync(pandaConfigPath)).toBe(true)
  })

  it('emits the configured token names into panda.config.ts', () => {
    const source = readFileSync(pandaConfigPath, 'utf-8')

    expect(source).toContain('matrixPrimaryToken')
    expect(source).toContain('matrixMutedToken')
  })

  it('emits CSS variables for the configured tokens', () => {
    const source = readFileSync(stylesPath, 'utf-8')

    expect(source).toContain('--colors-matrix-primary-token')
    expect(source).toContain('--colors-matrix-muted-token')
  })

  it('does not keep stale watch-only token output in clean sync artifacts', () => {
    const source = readFileSync(pandaConfigPath, 'utf-8')

    expect(source).not.toContain('e2e-watch-token')
  })
})