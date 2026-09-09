import { describe, expect, it, vi } from 'vitest'
import { toast } from './Toast'

describe('Toast SSR', () => {
  it('TO-ENV-01: define is request-safe and show returns an id without a document', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const Saved = toast.define<{ name: string }>({
      duration: 4000,
      render: ({ name }) => name,
    })
    expect(typeof Saved).toBe('function')
    const id = toast.show('ssr', { id: 'ssr' })
    expect(id).toBe('ssr')
    expect(Saved({ name: 'Draft' }, { id: 'ssr-def' })).toBe('ssr-def')
    expect(warn).toHaveBeenCalled()
    toast.update('ssr', 'nope')
    toast.dismiss('ssr')
    toast.dismiss(undefined)
    warn.mockRestore()
  })
})
