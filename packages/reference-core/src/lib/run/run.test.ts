import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runCommand } from './index'

vi.mock('../log', () => ({
  log: { error: vi.fn() },
}))

describe('runCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('executes successfully', async () => {
    const fn = runCommand(() => Promise.resolve())
    await expect(fn({})).resolves.toBeUndefined()
  })

  it('propagates errors to process.exit', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    const fn = runCommand(() => {
      throw new Error('oops')
    })

    await fn({})

    expect(exitSpy).toHaveBeenCalledWith(1)
    exitSpy.mockRestore()
  })
})
