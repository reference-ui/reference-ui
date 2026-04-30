import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(__dirname, '..', '..')
const refUiDir = join(packageRoot, '.reference-ui')
const pandaConfigPath = join(refUiDir, 'panda.config.ts')
const stylesPath = join(refUiDir, 'react', 'styles.css')
const sourceDir = join(packageRoot, 'src')
const beforeFragmentPath = join(sourceDir, 'tokens-migration-before.ts')
const afterFragmentPath = join(sourceDir, 'tokens-migration-after.ts')

function runRefSync(): void {
  try {
    execFileSync('pnpm', ['exec', 'ref', 'sync'], {
      cwd: packageRoot,
      env: { ...process.env, FORCE_COLOR: '0' },
      maxBuffer: 10 * 1024 * 1024,
      stdio: 'pipe',
    })
  } catch (error) {
    if (!(error instanceof Error) || !('stdout' in error) || !('stderr' in error)) {
      throw error
    }

    const stdout = Buffer.isBuffer(error.stdout) ? error.stdout.toString('utf8') : String(error.stdout)
    const stderr = Buffer.isBuffer(error.stderr) ? error.stderr.toString('utf8') : String(error.stderr)

    throw new Error(
      ['ref sync failed', '', 'stdout:', stdout.trim() || '(empty)', '', 'stderr:', stderr.trim() || '(empty)'].join('\n'),
    )
  }
}

function buildTokenFragment(tokenName: string, tokenValue: string): string {
  return [
    "import { tokens } from '@reference-ui/system'",
    '',
    'tokens({',
    '  colors: {',
    `    ${JSON.stringify(tokenName)}: { value: '${tokenValue}' },`,
    '  },',
    '})',
    '',
  ].join('\n')
}

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

  it('does not keep stale watch-only CSS variables in clean sync artifacts', () => {
    const source = readFileSync(stylesPath, 'utf-8')

    expect(source).not.toContain('e2e-watch-token')
    expect(source).not.toContain('--colors-e2e-watch-token')
  })

  it('removes renamed fragment token output from generated artifacts after a second ref sync pass', () => {
    const beforeToken = 'matrixMigratedBefore'
    const beforeValue = '#0f766e'
    const beforeVariable = '--colors-matrix-migrated-before'
    const afterToken = 'matrixMigratedAfter'
    const afterValue = '#b45309'
    const afterVariable = '--colors-matrix-migrated-after'

    try {
      writeFileSync(beforeFragmentPath, buildTokenFragment(beforeToken, beforeValue))
      runRefSync()

      expect(readFileSync(pandaConfigPath, 'utf-8')).toContain(beforeToken)
      expect(readFileSync(stylesPath, 'utf-8')).toContain(beforeVariable)

      renameSync(beforeFragmentPath, afterFragmentPath)
      writeFileSync(afterFragmentPath, buildTokenFragment(afterToken, afterValue))
      runRefSync()

      const generatedConfig = readFileSync(pandaConfigPath, 'utf-8')
      const generatedStyles = readFileSync(stylesPath, 'utf-8')

      expect(generatedConfig).toContain(afterToken)
      expect(generatedConfig).not.toContain(beforeToken)
      expect(generatedStyles).toContain(afterVariable)
      expect(generatedStyles).not.toContain(beforeVariable)
    } finally {
      if (existsSync(beforeFragmentPath)) {
        rmSync(beforeFragmentPath)
      }

      if (existsSync(afterFragmentPath)) {
        rmSync(afterFragmentPath)
      }

      runRefSync()
    }
  }, 120_000)
})