/** Proof for document routing: targeted isolation and ambiguous no-ops. */
import { describe, expect, it, vi } from 'vitest'
import { toast } from '../api/toast'
import { getToastStore } from './store'
import { registerToastDocument, unregisterToastDocument } from './documents'

function doc(): Document {
  return {} as Document
}

function active(d: Document) {
  return getToastStore(d).toasts.filter(item => !item.exiting)
}

describe('TO-ENV documents and diagnostics', () => {
  it('TO-ENV-05: targeted calls isolate stores; untargeted multi-document is a no-op', () => {
    const a = doc()
    const b = doc()
    registerToastDocument(a)
    registerToastDocument(b)
    toast('a', { id: 'same', document: a })
    toast('b', { id: 'same', document: b })
    expect(active(a)[0]?.title).toBe('a')
    expect(active(b)[0]?.title).toBe('b')

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    toast('untargeted', { id: 'same' })
    expect(active(a)[0]?.title).toBe('a')
    expect(active(b)[0]?.title).toBe('b')
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
    unregisterToastDocument(a)
    unregisterToastDocument(b)
  })
})
