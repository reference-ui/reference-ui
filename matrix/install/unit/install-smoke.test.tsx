import { execFileSync } from 'node:child_process'

import { describe, expect, it } from 'vitest'

import { App } from '../src/App'

function runRefSync(): void {
  try {
    execFileSync('pnpm', ['exec', 'ref', 'sync'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        FORCE_COLOR: '0',
      },
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
      ['ref sync failed', '', 'stdout:', stdout.trim() || '(empty)', '', 'stderr:', stderr.trim() || '(empty)'].join('\n')
    )
  }
}

describe('install matrix app', () => {
  it('exposes the minimal downstream marker content', () => {
    const element = App()

    expect(element.type).toBe('main')
    expect(element.props['data-testid']).toBe('install-root')

    const children = element.props.children as Array<{ props?: { children?: string } }>

    expect(children[0]?.props?.children).toBe('Reference UI install matrix')
    expect(children[1]?.props?.children).toBe('This is the minimal matrix-enabled install scenario.')
  })

  it(
    'allows one additional ref sync run in the same consumer',
    () => {
      runRefSync()
    },
    90_000
  )
})