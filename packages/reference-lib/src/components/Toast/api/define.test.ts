/** Proof for defined toasts: inert factories, exact props, generation-guarded close. */
import { describe, expect, it } from 'vitest'
import { toast } from './toast'
import { getToastStore } from '../state/store'

function doc(): Document {
  return {} as Document
}

function active(d: Document) {
  return getToastStore(d).toasts.filter(item => !item.exiting)
}

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
