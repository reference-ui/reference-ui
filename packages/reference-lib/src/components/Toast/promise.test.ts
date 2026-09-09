import { describe, expect, it } from 'vitest'
import { toast } from './Toast'

describe('TO-UNWRAP-01 toast.promise unwrap', () => {
  it('exposes the original promise from unwrap, including rejection', async () => {
    const resolved = Promise.resolve({ id: 7 })
    const result = toast.promise(resolved, {
      loading: 'Loading',
      success: 'Done',
    })
    expect(await result.unwrap()).toEqual({ id: 7 })
    await expect(result).resolves.toEqual({ id: 7 })

    const failed = Promise.reject(new Error('boom'))
    const rejected = toast.promise(failed, {
      loading: 'Loading',
      error: 'Failed',
    })
    await expect(rejected.unwrap()).rejects.toThrow('boom')
    await expect(rejected).rejects.toThrow('boom')
  })

  it('accepts Sonner extended success and error results', async () => {
    const doc = {} as Document
    const settled = toast.promise(Promise.resolve({ file: 'a.txt' }), {
      loading: 'Saving',
      success: data => ({
        message: `Saved ${data.file}`,
        description: 'Ready',
        duration: 2000,
      }),
    }, { document: doc })
    await settled

    const active = toast.getToasts(doc)
    expect(active).toHaveLength(1)
    expect(active[0]?.type).toBe('success')

    const dismissed: string[] = []
    toast('Keep me', {
      id: 'manual',
      document: doc,
      onDismiss: id => dismissed.push(id),
    })
    toast.dismiss('manual', { document: doc })
    expect(dismissed).toEqual(['manual'])
    expect(toast.getHistory(doc).some(record => record.id === 'manual' && record.dismissedAt)).toBe(true)

    toast.dismiss(undefined, { document: doc })
    expect(toast.getToasts(doc)).toEqual([])
  })
})
