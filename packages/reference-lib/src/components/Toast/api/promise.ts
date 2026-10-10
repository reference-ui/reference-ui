/**
 * Toast promises: shows a loading toast, then rewrites it from the
 * settlement value. Success and error results may be plain content, data
 * callbacks, or Sonner extended results ({ message, ...toastOptions })
 * that split into content plus overrides. The returned promise carries
 * unwrap for the original settlement and runs finally exactly once.
 */
import type * as React from 'react'
import { showToast, updateToast } from './toast'
import { splitPromiseResult } from '../toastQueue'
import type { DefaultToastOptions, PromiseData, ToastOptions } from '../types'

async function applyPromiseUpdate(
  id: string,
  raw: unknown,
  fallback: React.ReactNode,
  type: 'success' | 'error',
  options: ToastOptions | undefined,
  description?: React.ReactNode
) {
  const value = raw instanceof Promise ? await raw : raw
  const extended = splitPromiseResult(value)
  if (extended) {
    const extra = extended.options as DefaultToastOptions
    updateToast(id, (extended.message as React.ReactNode) ?? fallback, {
      ...options,
      ...extra,
      type: extra.type ?? type,
      description: extra.description ?? description,
      duration: extra.duration ?? options?.duration ?? 4000,
    })
    return
  }
  updateToast(id, (value as React.ReactNode) ?? fallback, {
    ...options,
    type,
    description,
    duration: options?.duration ?? 4000,
  })
}

export function runToastPromise<T>(
  promise: Promise<T> | (() => Promise<T>),
  data: PromiseData<T>,
  options?: ToastOptions
): Promise<T> & { unwrap: () => Promise<T> } {
  const id = showToast(data.loading ?? 'Loading...', {
    ...options,
    type: 'loading',
    duration: false,
  })

  const original = typeof promise === 'function' ? promise() : promise

  const settled = original
    .then(async res => {
      const successRaw =
        typeof data.success === 'function' ? await data.success(res) : data.success
      const desc =
        typeof data.description === 'function' ? data.description(res) : data.description
      await applyPromiseUpdate(
        id,
        successRaw,
        'Completed successfully',
        'success',
        options,
        desc
      )
      return res
    })
    .catch(async err => {
      const errorRaw = typeof data.error === 'function' ? await data.error(err) : data.error
      await applyPromiseUpdate(id, errorRaw, 'An error occurred', 'error', options)
      throw err
    })
    .finally(async () => {
      await data.finally?.()
    }) as Promise<T> & { unwrap: () => Promise<T> }

  settled.unwrap = () => original
  return settled
}
