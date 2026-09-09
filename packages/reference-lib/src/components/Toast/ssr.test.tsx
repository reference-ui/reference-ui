import { describe, expect, it } from 'vitest'
import { toast } from './Toast'

describe('Toast SSR', () => {
  it('TO-ENV-01: define is request-safe and show returns an id without a document', () => {
    const Saved = toast.define<{ name: string }>({
      duration: 4000,
      render: ({ name }) => name,
    })
    expect(typeof Saved).toBe('function')
    const id = toast.show('ssr', { id: 'ssr' })
    expect(id).toBe('ssr')
    expect(Saved({ name: 'Draft' }, { id: 'ssr-def' })).toBe('ssr-def')
  })
})
