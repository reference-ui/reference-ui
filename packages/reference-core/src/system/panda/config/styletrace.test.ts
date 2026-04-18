import { afterEach, describe, expect, it, vi } from 'vitest'

type TraceMap = Record<string, string[] | Error>

function setupMocks(options?: { files?: string[]; traceMap?: TraceMap }) {
  const fg = vi.fn(async () => options?.files ?? [])
  const trace = vi.fn(async (root: string) => {
    const value = options?.traceMap?.[root]
    if (value instanceof Error) {
      throw value
    }
    return value ?? []
  })
  const warn = vi.fn()

  vi.doMock('fast-glob', () => ({
    default: fg,
  }))
  vi.doMock('@reference-ui/rust/styletrace', () => ({
    trace,
  }))
  vi.doMock('../../../lib/log', () => ({
    log: { warn },
  }))

  return { fg, trace, warn }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('fast-glob')
  vi.doUnmock('@reference-ui/rust/styletrace')
  vi.doUnmock('../../../lib/log')
  vi.restoreAllMocks()
})

describe('system/panda/config/styletrace', () => {
  it('resolves shallow include roots from matched files and ignores nested duplicates', async () => {
    setupMocks({
      files: [
        '/workspace/app/src/index.tsx',
        '/workspace/app/src/components/Card.tsx',
        '/workspace/app/tests/example.test.tsx',
      ],
    })

    const { resolveStyletraceRoots } = await import('./styletrace')

    await expect(resolveStyletraceRoots('/workspace/app', ['src/**/*.{ts,tsx}', 'tests/**/*.tsx']))
      .resolves.toEqual(['/workspace/app/src', '/workspace/app/tests'])
  })

  it('traces each include root and returns a stable merged JSX list', async () => {
    const { trace } = setupMocks({
      files: [
        '/workspace/app/src/index.tsx',
        '/workspace/app/src/components/Card.tsx',
        '/workspace/app/tests/smoke.tsx',
      ],
      traceMap: {
        '/workspace/app/src': ['ShellCard', 'MyIcon'],
        '/workspace/app/tests': ['MyIcon', 'TestHarness'],
      },
    })

    const { traceIncludedJsxElements } = await import('./styletrace')

    await expect(traceIncludedJsxElements('/workspace/app', ['src/**/*.{ts,tsx}', 'tests/**/*.tsx']))
      .resolves.toEqual(['MyIcon', 'ShellCard', 'TestHarness'])
    expect(trace).toHaveBeenCalledWith('/workspace/app/src')
    expect(trace).toHaveBeenCalledWith('/workspace/app/tests')
  })

  it('ignores non-JSX helper files when deriving trace roots', async () => {
    setupMocks({
      files: [
        '/workspace/app/tests/mcp/helpers.ts',
        '/workspace/app/tests/watch/watch.test.tsx',
      ],
    })

    const { resolveStyletraceRoots } = await import('./styletrace')

    await expect(resolveStyletraceRoots('/workspace/app', ['tests/**/*.{ts,tsx}']))
      .resolves.toEqual(['/workspace/app/tests/watch'])
  })

  it('returns an empty list when no include files match', async () => {
    const { trace } = setupMocks({ files: [] })
    const { traceIncludedJsxElements } = await import('./styletrace')

    await expect(traceIncludedJsxElements('/workspace/app', ['src/**/*.{ts,tsx}'])).resolves.toEqual([])
    expect(trace).not.toHaveBeenCalled()
  })

  it('skips roots that fail analysis and keeps the remaining traced names', async () => {
    const { warn, trace } = setupMocks({
      files: [
        '/workspace/app/src/App.tsx',
        '/workspace/app/tests/reference/component.test.tsx',
      ],
      traceMap: {
        '/workspace/app/src': ['AppShell'],
        '/workspace/app/tests/reference': new Error('failed to resolve node:path'),
      },
    })

    const { traceIncludedJsxElements } = await import('./styletrace')

    await expect(traceIncludedJsxElements('/workspace/app', ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}']))
      .resolves.toEqual(['AppShell'])
    expect(trace).toHaveBeenCalledWith('/workspace/app/src')
    expect(trace).toHaveBeenCalledWith('/workspace/app/tests/reference')
    expect(warn).toHaveBeenCalledWith(
      '[config] skipping styletrace root after analysis failure',
      'failed to resolve node:path'
    )
  })
})