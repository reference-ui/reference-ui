import { afterEach, describe, expect, it, vi } from 'vitest'

async function importGenModule(options?: {
  codegenFailure?: Error
  cssFailure?: Error
}) {
  vi.resetModules()

  const emit = vi.fn()
  const debug = vi.fn()
  const error = vi.fn()
  const runPandaCodegen = vi.fn(async () => {
    if (options?.codegenFailure) throw options.codegenFailure
  })
  const runPandaCss = vi.fn(async () => {
    if (options?.cssFailure) throw options.cssFailure
  })

  vi.doMock('../../../lib/event-bus', () => ({
    emit,
  }))
  vi.doMock('../../../lib/log', () => ({
    log: { debug, error },
  }))
  vi.doMock('./codegen', () => ({
    runPandaCodegen,
    runPandaCss,
  }))

  const mod = await import('./index')
  return { ...mod, emit, debug, error, runPandaCodegen, runPandaCss }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../../../lib/event-bus')
  vi.doUnmock('../../../lib/log')
  vi.doUnmock('./codegen')
  vi.restoreAllMocks()
})

describe('system/panda/gen', () => {
  it('onRunCodegen emits css then codegen on success', async () => {
    const { onRunCodegen, emit, runPandaCodegen } = await importGenModule()

    onRunCodegen()

    await vi.waitFor(() => {
      expect(runPandaCodegen).toHaveBeenCalled()
      expect(emit).toHaveBeenNthCalledWith(1, 'system:panda:css')
      expect(emit).toHaveBeenNthCalledWith(2, 'system:panda:codegen')
    })
  })

  it('onRunCodegen logs failures and emits codegen:failed (not codegen)', async () => {
    const { onRunCodegen, emit, error, debug } = await importGenModule({
      codegenFailure: Object.assign(new Error('panda exploded'), {
        stack: 'stack: panda exploded',
      }),
    })

    onRunCodegen()

    await vi.waitFor(() => {
      expect(error).toHaveBeenCalledWith(
        '[panda] codegen failed (continuing without system/styled). Virtual copy will still run.',
        'panda exploded'
      )
      expect(debug).toHaveBeenCalledWith('panda', 'stack: panda exploded')
      expect(emit).toHaveBeenCalledTimes(1)
      expect(emit).toHaveBeenCalledWith('system:panda:codegen:failed')
    })
  })

  it('onRunCss emits css completion on success', async () => {
    const { onRunCss, emit, runPandaCss } = await importGenModule()

    onRunCss()

    await vi.waitFor(() => {
      expect(runPandaCss).toHaveBeenCalled()
      expect(emit).toHaveBeenCalledWith('system:panda:css')
    })
  })
})
