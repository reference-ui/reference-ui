import { afterEach, describe, expect, it, vi } from 'vitest'
import { toast } from './Toast'
import {
  getToastStore,
  referenceToast,
  registerToastDocument,
  setToastDefaults,
  toastDiagnostic,
  unregisterToastDocument,
} from './toastRuntime'
import {
  LIBRARY_TOAST_DURATION,
  LIBRARY_TOAST_LIMIT,
  LIBRARY_TOAST_POSITION,
  remainingAfterElapsed,
  shouldAutoDismiss,
  TOAST_HISTORY_LIMIT,
  visibleToasts,
  waitingToasts,
} from './toastQueue'

function doc(): Document {
  return {} as Document
}

function active(d: Document) {
  return getToastStore(d).toasts.filter(item => !item.exiting)
}

describe('TO-ID identity and update', () => {
  it('TO-ID-01: generates distinct stable string IDs when callers omit identity', () => {
    const d = doc()
    const first = toast('first', { document: d })
    const second = toast('second', { document: d })
    expect(first).toBeTruthy()
    expect(second).toBeTruthy()
    expect(first).not.toBe(second)
    expect(active(d).map(item => item.id)).toEqual([first, second])
    toast.update(first, 'first-updated', { document: d })
    expect(active(d).map(item => item.id)).toEqual([first, second])
  })

  it('TO-ID-02: preserves caller identity including an empty string', () => {
    const d = doc()
    const empty = toast('empty', { id: '', document: d })
    const named = toast('named', { id: 'upload:42', document: d })
    expect(empty).toBe('')
    expect(named).toBe('upload:42')
    expect(active(d).map(item => item.id)).toEqual(['', 'upload:42'])
    toast.update('', 'empty-updated', { document: d })
    toast.dismiss('upload:42', { document: d })
    expect(active(d).map(item => item.id)).toEqual([''])
  })

  it('TO-ID-03: toast.show with an active ID updates in place', () => {
    const d = doc()
    const id = toast('Saving', { id: 'save', duration: 5000, position: 'bottom-end', document: d })
    const again = toast('Saved', { id: 'save', duration: 1000, position: 'top-end', document: d })
    expect(again).toBe(id)
    expect(active(d)).toHaveLength(1)
    expect(active(d)[0]?.title).toBe('Saved')
    expect(active(d)[0]?.duration).toBe(1000)
    expect(active(d)[0]?.position).toBe('top-end')
    expect(active(d)[0]?.remaining).toBe(1000)
  })

  it('TO-ID-04: toast.update replaces definition props without stale fields', () => {
    const d = doc()
    const Saved = toast.define<{ title: string; stale?: boolean }>({
      render: ({ title }) => title,
    })
    Saved({ title: 'Old', stale: true }, { id: 'draft', document: d, duration: false })
    Saved.update('draft', { title: 'New' }, { document: d })
    expect(active(d)).toHaveLength(1)
    expect(active(d)[0]?.content).toBe('New')
  })

  it('TO-ID-05: an update that changes position keeps identity', () => {
    const d = doc()
    toast('keep', { id: 'move', position: 'bottom-end', document: d })
    toast('other', { id: 'other', position: 'bottom-end', document: d })
    toast.update('move', 'moved', { position: 'top-start', document: d })
    const item = active(d).find(item => item.id === 'move')
    expect(item?.position).toBe('top-start')
    expect(item?.title).toBe('moved')
    expect(active(d).find(item => item.id === 'other')?.position).toBe('bottom-end')
  })

  it('TO-ID-06: toast.update on unknown or dismissed IDs is a diagnosed no-op', () => {
    const d = doc()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const before = active(d).length
    toast.update('missing', 'nope', { document: d })
    expect(active(d)).toHaveLength(before)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('missing'))

    toast('gone', { id: 'gone', document: d })
    toast.dismiss('gone', { document: d })
    warn.mockClear()
    toast.update('gone', 'resurrect', { document: d })
    expect(active(d).find(item => item.id === 'gone')).toBeUndefined()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('gone'))
    warn.mockRestore()
  })

  it('TO-ID-07: a fully dismissed ID reused does not inherit old chrome', () => {
    const d = doc()
    toast('Old', {
      id: 'reuse',
      duration: false,
      position: 'top-start',
      action: { label: 'Undo' },
      document: d,
    })
    toast.dismiss('reuse', { document: d })
    toast('New', { id: 'reuse', document: d })
    const item = active(d).find(item => item.id === 'reuse')
    expect(item?.title).toBe('New')
    expect(item?.action).toBeUndefined()
    expect(item?.position).toBe(LIBRARY_TOAST_POSITION)
    expect(item?.duration).toBe(LIBRARY_TOAST_DURATION)
    expect(item?.exiting).toBeFalsy()
  })

  it('TO-ID-08: dismiss then same-ID show in one turn keeps a fresh open record', () => {
    const d = doc()
    registerToastDocument(d)
    getToastStore(d).subscribers.add(() => {})
    toast('old', { id: 'race', document: d })
    toast.dismiss('race', { document: d })
    toast('fresh', { id: 'race', document: d })
    const item = getToastStore(d).toasts.find(item => item.id === 'race')
    expect(item?.title).toBe('fresh')
    expect(item?.exiting).toBeFalsy()
    expect(item?.generation).toBe(2)
    unregisterToastDocument(d)
  })

  it('TO-ID-09: repeated lifecycle cycles do not grow unbounded work', () => {
    const d = doc()
    for (let i = 0; i < 1200; i++) {
      const id = `cycle-${i % 7}`
      toast(`n-${i}`, { id, document: d })
      toast.update(id, `u-${i}`, { document: d })
      toast.dismiss(id, { document: d })
    }
    expect(active(d).length).toBe(0)
    expect(getToastStore(d).history.length).toBeLessThanOrEqual(TOAST_HISTORY_LIMIT)
  })
})

describe('TO-OPT option precedence', () => {
  it('TO-OPT-01: invocation then definition then library then defaults', () => {
    const d = doc()
    setToastDefaults({ duration: 3000, position: 'top-start' }, d)
    const Defined = toast.define({
      duration: 2000,
      position: 'top-center',
      render: () => 'x',
    })
    Defined(undefined, { id: 'inv', duration: 1000, document: d })
    const DefinedPos = toast.define({
      duration: 2000,
      position: 'top-center',
      render: () => 'y',
    })
    DefinedPos(undefined, { id: 'def', document: d })
    toast('lib', { id: 'lib', document: d })
    expect(active(d).find(item => item.id === 'inv')?.duration).toBe(1000)
    expect(active(d).find(item => item.id === 'def')?.duration).toBe(2000)
    expect(active(d).find(item => item.id === 'def')?.position).toBe('top-center')
    expect(active(d).find(item => item.id === 'lib')?.duration).toBe(3000)
    expect(active(d).find(item => item.id === 'lib')?.position).toBe('top-start')
  })

  it('TO-OPT-02: falsey durations 2500, 0, and false win; only undefined falls through', () => {
    const d = doc()
    setToastDefaults({ duration: 3333 }, d)
    toast('a', { id: 'n', duration: 2500, document: d })
    toast('b', { id: 'z', duration: 0, document: d })
    toast('c', { id: 'f', duration: false, document: d })
    toast('d', { id: 'u', document: d })
    expect(active(d).find(item => item.id === 'n')?.duration).toBe(2500)
    expect(active(d).find(item => item.id === 'z')?.duration).toBe(0)
    expect(active(d).find(item => item.id === 'f')?.duration).toBe(false)
    expect(active(d).find(item => item.id === 'u')?.duration).toBe(3333)
  })

  it('TO-OPT-03: every position string wins at its precedence layer', () => {
    const d = doc()
    const positions = [
      'top-start',
      'top-center',
      'top-end',
      'bottom-start',
      'bottom-center',
      'bottom-end',
    ] as const
    for (const position of positions) {
      toast(position, { id: position, position, document: d })
      expect(active(d).find(item => item.id === position)?.position).toBe(position)
    }
  })

  it('TO-OPT-04: content-only update keeps remaining time; explicit duration restarts', () => {
    const d = doc()
    toast('stable', { id: 'stable-options', duration: 5000, position: 'bottom-center', document: d })
    const item = active(d)[0]!
    item.remaining = 3800
    toast.update('stable-options', 'only-content', { document: d })
    expect(active(d)[0]?.position).toBe('bottom-center')
    expect(active(d)[0]?.remaining).toBe(3800)
    toast.update('stable-options', 'moved', { duration: 900, position: 'top-start', document: d })
    expect(active(d)[0]?.position).toBe('top-start')
    expect(active(d)[0]?.remaining).toBe(900)
  })

  it('TO-OPT-05: replacement definition defaults apply when update omits fields', () => {
    const d = doc()
    const A = toast.define({ duration: 5000, position: 'bottom-end', render: () => 'A' })
    const B = toast.define({ duration: 1200, position: 'top-center', render: () => 'B' })
    A(undefined, { id: 'swap', document: d })
    B.update('swap', undefined, { position: 'top-start', document: d })
    expect(active(d)[0]?.duration).toBe(1200)
    expect(active(d)[0]?.position).toBe('top-start')
  })

  it('TO-OPT-06: omitted public layers freeze 5000ms, bottom-end, and limit 4', () => {
    const d = doc()
    setToastDefaults({
      duration: LIBRARY_TOAST_DURATION,
      position: LIBRARY_TOAST_POSITION,
      limit: LIBRARY_TOAST_LIMIT,
    }, d)
    for (let i = 0; i < 5; i++) toast(`n${i}`, { id: `n${i}`, document: d })
    const all = active(d)
    expect(all[0]?.duration).toBe(5000)
    expect(all[0]?.position).toBe('bottom-end')
    expect(visibleToasts(all, LIBRARY_TOAST_LIMIT)).toHaveLength(4)
    expect(waitingToasts(all, LIBRARY_TOAST_LIMIT).map(item => item.id)).toEqual(['n4'])
  })
})

describe('TO-QUEUE waiting FIFO', () => {
  it('TO-QUEUE-01: visible items stay insertion-ordered through updates', () => {
    const d = doc()
    toast('a', { id: 'a', position: 'top-end', document: d })
    toast('b', { id: 'b', position: 'top-end', document: d })
    toast('c', { id: 'c', position: 'top-end', document: d })
    toast.update('b', 'b2', { document: d })
    expect(active(d).map(item => item.id)).toEqual(['a', 'b', 'c'])
  })

  it('TO-QUEUE-03: oldest waiter promotes with its full duration', () => {
    const d = doc()
    setToastDefaults({ limit: 1 }, d)
    toast('a', { id: 'a', duration: 1000, document: d })
    toast('b', { id: 'b', duration: 500, document: d })
    expect(visibleToasts(active(d), 1).map(item => item.id)).toEqual(['a'])
    expect(active(d).find(item => item.id === 'b')?.remaining).toBe(500)
    toast.dismiss('a', { document: d })
    expect(visibleToasts(active(d), 1).map(item => item.id)).toEqual(['b'])
    expect(active(d).find(item => item.id === 'b')?.remaining).toBe(500)
  })

  it('TO-QUEUE-04: updating or dismissing a waiter never mounts stale content', () => {
    const d = doc()
    setToastDefaults({ limit: 1 }, d)
    toast('a', { id: 'a', document: d })
    toast('Old', { id: 'b', document: d })
    toast('c', { id: 'c', document: d })
    toast.update('b', 'New', { document: d })
    toast.dismiss('c', { document: d })
    expect(active(d).map(item => item.id)).toEqual(['a', 'b'])
    expect(active(d).find(item => item.id === 'b')?.title).toBe('New')
  })

  it('TO-QUEUE-05: show with a queued ID upserts in place without promoting', () => {
    const d = doc()
    setToastDefaults({ limit: 1 }, d)
    toast('a', { id: 'a', document: d })
    toast('b', { id: 'b', document: d })
    toast('c', { id: 'c', document: d })
    const id = toast('NewB', { id: 'b', duration: 700, document: d })
    expect(id).toBe('b')
    expect(active(d).map(item => item.id)).toEqual(['a', 'b', 'c'])
    expect(active(d).find(item => item.id === 'b')?.remaining).toBe(700)
    expect(visibleToasts(active(d), 1).map(item => item.id)).toEqual(['a'])
  })

  it('TO-QUEUE-06: lowering then raising limit demotes newest excess ahead of waiters', () => {
    const d = doc()
    setToastDefaults({ limit: 4 }, d)
    for (const id of ['a', 'b', 'c', 'd', 'e']) toast(id, { id, duration: 5000, document: d })
    active(d).find(item => item.id === 'c')!.remaining = 4000
    setToastDefaults({ limit: 2 }, d)
    const afterLower = active(d)
    expect(visibleToasts(afterLower, 2).map(item => item.id)).toEqual(['a', 'b'])
    expect(waitingToasts(afterLower, 2).map(item => item.id)).toEqual(['c', 'd', 'e'])
    expect(afterLower.find(item => item.id === 'c')?.remaining).toBe(4000)
    setToastDefaults({ limit: 4 }, d)
    expect(visibleToasts(active(d), 4).map(item => item.id)).toEqual(['a', 'b', 'c', 'd'])
    expect(active(d).find(item => item.id === 'c')?.remaining).toBe(4000)
  })

  it('TO-QUEUE-07: one global limit is shared across positions', () => {
    const d = doc()
    setToastDefaults({ limit: 2 }, d)
    toast('a', { id: 'a', position: 'top-start', document: d })
    toast('b', { id: 'b', position: 'bottom-end', document: d })
    toast('c', { id: 'c', position: 'top-start', document: d })
    toast('d', { id: 'd', position: 'bottom-end', document: d })
    expect(visibleToasts(active(d), 2).map(item => item.id)).toEqual(['a', 'b'])
    toast.dismiss('a', { document: d })
    expect(visibleToasts(active(d), 2).map(item => item.id)).toEqual(['b', 'c'])
  })

  it('TO-QUEUE-08: dismiss() without an ID clears visible, queued, and paused work', () => {
    const d = doc()
    setToastDefaults({ limit: 1 }, d)
    toast('a', { id: 'a', duration: 5000, document: d })
    toast('b', { id: 'b', duration: false, document: d })
    toast.dismiss(undefined, { document: d })
    expect(active(d)).toEqual([])
    expect(getToastStore(d).toasts).toEqual([])
  })
})

describe('TO-TIME remaining time', () => {
  it('TO-TIME-06: pause/resume accumulates only active elapsed time', () => {
    let remaining: number | false = 5000
    remaining = remainingAfterElapsed(remaining, 1000) as number
    remaining = remainingAfterElapsed(remaining, 0) as number
    remaining = remainingAfterElapsed(remaining, 1000) as number
    expect(remaining).toBe(3000)
    expect(shouldAutoDismiss(remainingAfterElapsed(remaining, 2999))).toBe(false)
    expect(shouldAutoDismiss(remainingAfterElapsed(remaining, 3000))).toBe(true)
  })

  it('TO-TIME-09: content-only update preserves remaining', () => {
    const d = doc()
    toast('content', { id: 'content', duration: 5000, document: d })
    active(d)[0]!.remaining = 3800
    toast.update('content', 'progress', { document: d })
    expect(active(d)[0]?.remaining).toBe(3800)
    expect(active(d)[0]?.title).toBe('progress')
  })

  it('TO-TIME-10: explicit duration changes replace timer state', () => {
    const d = doc()
    toast('t', { id: 'modes', duration: 5000, document: d })
    active(d)[0]!.remaining = 4000
    toast.update('modes', 't', { duration: 900, document: d })
    expect(active(d)[0]?.remaining).toBe(900)
    toast.update('modes', 't', { duration: false, document: d })
    expect(active(d)[0]?.duration).toBe(false)
    expect(active(d)[0]?.remaining).toBe(false)
    toast.update('modes', 't', { duration: 750, document: d })
    expect(active(d)[0]?.remaining).toBe(750)
  })

  it('TO-TIME-11: two updates before subscribers flush keep one current timer', () => {
    const d = doc()
    toast('loading', { id: 'double', duration: false, document: d })
    toast.update('double', 'success', { duration: 1000, document: d })
    toast.update('double', 'success-final', { document: d })
    expect(active(d)).toHaveLength(1)
    expect(active(d)[0]?.title).toBe('success-final')
    expect(active(d)[0]?.remaining).toBe(1000)
  })

  it('TO-TIME-08: a waiting record keeps its full duration until promotion', () => {
    const d = doc()
    setToastDefaults({ limit: 1 }, d)
    toast('visible', { id: 'visible', duration: false, document: d })
    toast('waiter', { id: 'waiter', duration: 500, document: d })
    const waiter = active(d).find(item => item.id === 'waiter')
    expect(visibleToasts(active(d), 1).map(item => item.id)).toEqual(['visible'])
    expect(waitingToasts(active(d), 1).map(item => item.id)).toEqual(['waiter'])
    expect(waiter?.remaining).toBe(500)
    expect(shouldAutoDismiss(remainingAfterElapsed(500, 30_000))).toBe(true)
    expect(active(d).find(item => item.id === 'waiter')?.remaining).toBe(500)
    toast.dismiss('visible', { document: d })
    expect(visibleToasts(active(d), 1).map(item => item.id)).toEqual(['waiter'])
    expect(active(d).find(item => item.id === 'waiter')?.remaining).toBe(500)
  })

  it('TO-TIME-12: closing the last timed toast beside untimed work does not poison a new timer', () => {
    const d = doc()
    toast('timed', { id: 'timed', duration: 100, document: d })
    toast('loading', { id: 'loading', duration: false, document: d })
    active(d).find(item => item.id === 'timed')!.remaining = 40
    toast.dismiss('timed', { document: d })
    expect(active(d).map(item => item.id)).toEqual(['loading'])
    expect(active(d)[0]?.remaining).toBe(false)
    toast('again', { id: 'again', duration: 100, document: d })
    const again = active(d).find(item => item.id === 'again')
    expect(again?.remaining).toBe(100)
    expect(shouldAutoDismiss(again?.remaining)).toBe(false)
    expect(shouldAutoDismiss(remainingAfterElapsed(again?.remaining, 200))).toBe(true)
  })
})

describe('TO-CLOSE dismiss', () => {
  it('TO-CLOSE-01: dismiss(id) removes only that visible or queued record', () => {
    const d = doc()
    setToastDefaults({ limit: 1 }, d)
    toast('a', { id: 'a', document: d })
    toast('b', { id: 'b', document: d })
    toast('c', { id: 'c', document: d })
    toast.dismiss('b', { document: d })
    expect(active(d).map(item => item.id)).toEqual(['a', 'c'])
    toast.dismiss('b', { document: d })
    expect(active(d).map(item => item.id)).toEqual(['a', 'c'])
  })

  it('TO-CLOSE-02: dismiss() without an ID closes every instance', () => {
    const d = doc()
    toast('a', { id: 'a', position: 'top-start', document: d })
    toast('b', { id: 'b', position: 'bottom-end', duration: false, document: d })
    toast.dismiss(undefined, { document: d })
    expect(active(d)).toEqual([])
  })

  it('TO-CLOSE-03: two close requests in one turn produce one lifecycle', () => {
    const d = doc()
    const dismissed: string[] = []
    toast('once', { id: 'once', document: d, onDismiss: id => dismissed.push(id) })
    toast.dismiss('once', { document: d })
    toast.dismiss('once', { document: d })
    expect(dismissed).toEqual(['once'])
    expect(active(d)).toEqual([])
  })

  it('TO-CLOSE-05: a stale generation cannot remove a recreated instance', () => {
    const d = doc()
    toast('old', { id: 'same', document: d })
    const generation = active(d)[0]!.generation
    toast.dismiss('same', { document: d })
    toast('fresh', { id: 'same', document: d })
    referenceToast.remove('same', { document: d, generation })
    expect(active(d)[0]?.title).toBe('fresh')
    expect(active(d)[0]?.generation).not.toBe(generation)
  })
})

describe('TO-DEF-01 define is inert until invoked', () => {
  it('TO-DEF-01: define does not render, allocate, or mutate a queue', () => {
    const d = doc()
    let rendered = 0
    const Saved = toast.define<{ name: string }>({
      duration: 4000,
      render: ({ name }) => {
        rendered += 1
        return name
      },
    })
    expect(typeof Saved).toBe('function')
    expect(rendered).toBe(0)
    expect(active(d)).toEqual([])
  })
})

describe('TO-DEF controls', () => {
  it('TO-DEF-02: definition render receives exact props and { id, close }', () => {
    const d = doc()
    const calls: Array<{ props: unknown; controls: unknown }> = []
    const ProjectSaved = toast.define<{ project: { id: number; name: string } }>({
      render(props, controls) {
        calls.push({ props, controls })
        return props.project.name
      },
    })
    const payload = { project: { id: 42, name: 'Draft' } }
    const id = ProjectSaved(payload, { id: 'save:42', document: d })
    expect(id).toBe('save:42')
    expect(calls).toHaveLength(1)
    expect(calls[0]?.props).toBe(payload)
    expect(calls[0]?.controls).toEqual({ id: 'save:42', close: expect.any(Function) })
    ;(calls[0]?.controls as { close: () => void }).close()
    expect(active(d)).toEqual([])
  })

  it('TO-DEF-06: StrictMode-style replay of show then update keeps one record', () => {
    const d = doc()
    let renders = 0
    const Saving = toast.define<{ label: string }>({
      render({ label }) {
        renders += 1
        return label
      },
    })
    Saving({ label: 'Saving' }, { id: 'strict', duration: 1000, document: d })
    Saving.update('strict', { label: 'Saved' }, { document: d })
    Saving({ label: 'Saving' }, { id: 'strict', duration: 1000, document: d })
    Saving.update('strict', { label: 'Saved' }, { document: d })
    expect(active(d)).toHaveLength(1)
    expect(active(d)[0]?.id).toBe('strict')
    expect(renders).toBe(4)
    expect(active(d)[0]?.remaining).toBe(1000)
  })

  it('TO-DEF-05: a stale close cannot dismiss a reused ID', () => {
    const d = doc()
    let close: (() => void) | undefined
    const Def = toast.define({
      render(_props, controls) {
        close = controls.close
        return 'x'
      },
    })
    Def(undefined, { id: 'same', document: d })
    const stale = close!
    toast.dismiss('same', { document: d })
    Def(undefined, { id: 'same', document: d })
    stale()
    expect(active(d).map(item => item.id)).toEqual(['same'])
    close!()
    expect(active(d)).toEqual([])
  })
})

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

describe('toastDiagnostic', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('emits a development warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    toastDiagnostic('hello')
    expect(warn).toHaveBeenCalledWith('[reference-ui] hello')
  })
})
