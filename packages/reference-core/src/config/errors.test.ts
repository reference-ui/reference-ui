// Unit tests for the Neo config error surface.
// They take a constructed cause and assert the LoadConfigError message, with
// focus on the upstream-sync hint appended for Reference UI module-resolution
// misses. No filesystem or resolver work: causes are built in-place.

import { describe, expect, it } from 'vitest'
import { LoadConfigError } from './errors.ts'

interface CodedError extends Error {
  code?: string
}

function moduleNotFound(specifier: string): CodedError {
  const error: CodedError = new Error(`Cannot find module '${specifier}'`)
  error.code = 'ERR_MODULE_NOT_FOUND'
  return error
}

// Node's shape for a package that is not installed at all: the specifier is
// missing, no `.reference-ui/` path is involved.
function packageNotFound(specifier: string): CodedError {
  const error: CodedError = new Error(`Cannot find package '${specifier}' imported from /repo/ui.config.ts`)
  error.code = 'ERR_MODULE_NOT_FOUND'
  return error
}

const RESOLVED_UPSTREAM = '/repo/node_modules/@reference-ui/lib/.reference-ui/system/baseSystem.mjs'
const RESOLVED_UPSTREAM_WIN32 =
  'C:\\repo\\node_modules\\@reference-ui\\lib\\.reference-ui\\system\\baseSystem.mjs'

describe('LoadConfigError', () => {
  it('appends the upstream sync hint for a missing Reference UI system module', () => {
    const cause = moduleNotFound(RESOLVED_UPSTREAM)
    const error = new LoadConfigError('/repo/ui.config.ts', cause)
    expect(error.message).toContain('Failed to load /repo/ui.config.ts')
    expect(error.message).toContain('Run sync on the upstream package first')
  })

  it('appends the hint for a Windows-shaped resolved path', () => {
    const cause = moduleNotFound(RESOLVED_UPSTREAM_WIN32)
    const error = new LoadConfigError('C:\\repo\\ui.config.ts', cause)
    expect(error.message).toContain('Run sync on the upstream package first')
  })

  it('walks the cause chain for a wrapped module miss', () => {
    const wrapped = new Error('evaluation failed', { cause: moduleNotFound(RESOLVED_UPSTREAM) })
    const error = new LoadConfigError('/repo/ui.config.ts', wrapped)
    expect(error.message).toContain('Run sync on the upstream package first')
  })

  it('stays quiet for a not-installed Reference UI package', () => {
    const direct = new LoadConfigError('/repo/ui.config.ts', packageNotFound('@reference-ui/lib'))
    expect(direct.message).not.toContain('Run sync')

    const wrapped = new Error('evaluation failed', { cause: packageNotFound('@reference-ui/lib') })
    expect(new LoadConfigError('/repo/ui.config.ts', wrapped).message).not.toContain('Run sync')
  })

  it('stays quiet for unrelated failures and non-Reference misses', () => {
    expect(new LoadConfigError('/repo/ui.config.ts', new Error('syntax error')).message).not.toContain('Run sync')
    expect(new LoadConfigError('/repo/ui.config.ts', moduleNotFound('lodash')).message).not.toContain('Run sync')
  })
})
