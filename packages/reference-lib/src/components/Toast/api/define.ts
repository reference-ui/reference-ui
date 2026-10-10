/**
 * Defined toasts: reusable render-plus-defaults factories that stay inert
 * until invoked — define never renders, allocates, or mutates a queue.
 * Each invocation renders with { id, close }, where close captures the
 * toast's generation so a stale handle cannot dismiss a reused ID. Update
 * re-renders against the live record and diagnoses unknown IDs.
 */
import type * as React from 'react'
import { getToastStore } from '../state/store'
import { referenceToast, peekToastGeneration } from '../state/reference'
import { resolveToastDocument } from '../state/documents'
import { generateToastId } from '../shared/ids'
import { toastDiagnostic } from '../shared/diagnostic'
import { maybeAnnounce } from './announce'
import type { ToastControls, ToastDefinition, ToastOptions, ToastPosition } from '../types'

export function defineToastDefinition<P = void>(config: {
  duration?: number | false
  position?: ToastPosition
  render: (props: P, controls: ToastControls) => React.ReactNode
}): ToastDefinition<P> {
  const renderWithControls = (id: string, props: P, options?: ToastOptions) => {
    const generation = peekToastGeneration(id, options?.document)
    const close = () => {
      referenceToast.dismiss(id, { document: options?.document, generation })
    }
    return config.render(props, { id, close })
  }

  const fn = ((props: P, options?: ToastOptions) => {
    const id = options?.id ?? generateToastId()
    const content = renderWithControls(id, props, options)
    const shown = referenceToast.show(content, {
      ...options,
      id,
      duration: options?.duration ?? config.duration,
      position: options?.position ?? config.position,
    })
    maybeAnnounce(options)
    return shown
  }) as ToastDefinition<P>

  fn.update = (id: string, props: P, options?: ToastOptions) => {
    const doc = resolveToastDocument(options?.document)
    const store = getToastStore(doc)
    if (!store.toasts.some(item => item.id === id && !item.exiting)) {
      toastDiagnostic(`toast.update: unknown id "${id}"`)
      return
    }
    const content = renderWithControls(id, props, options)
    referenceToast.update(id, content, {
      ...options,
      duration: options?.duration ?? config.duration,
      position: options?.position ?? config.position,
    })
    maybeAnnounce(options)
  }

  fn.dismiss = (id: string) => {
    referenceToast.dismiss(id)
  }

  return fn
}
