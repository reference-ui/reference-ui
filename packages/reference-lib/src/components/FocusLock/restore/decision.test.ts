/**
 * Restore-decision proof: origin capture and target ranking. Pure
 * decisions with no DOM; the restore callback applies them.
 */
import { describe, expect, it } from 'vitest'
import { captureRestoreOrigin, resolveRestoreTarget, type RestoreSnapshot } from './decision'

function node(overrides: Record<string, unknown> = {}): HTMLElement {
  return {
    isConnected: true,
    parentElement: null,
    nextElementSibling: null,
    previousElementSibling: null,
    ...overrides,
  } as unknown as HTMLElement
}

describe('captureRestoreOrigin', () => {
  it('snapshots outside focus with its surroundings', () => {
    const parent = node()
    const next = node()
    const prev = node()
    const active = node({ parentElement: parent, nextElementSibling: next, previousElementSibling: prev })
    const snapshot = captureRestoreOrigin({
      active,
      body: node(),
      defaultTarget: null,
      pointer: null,
      isInside: () => false,
      isFocusable: () => true,
    })
    expect(snapshot).toEqual({ node: active, parent, next, prev })
  })

  it('prefers the default target, then the pointer, then active body', () => {
    const body = node()
    const fallback = node()
    const pointer = node()
    const base = {
      active: body,
      body,
      isInside: () => false,
      isFocusable: () => true,
    }
    expect(captureRestoreOrigin({ ...base, defaultTarget: fallback, pointer }).node).toBe(fallback)
    expect(captureRestoreOrigin({ ...base, defaultTarget: null, pointer }).node).toBe(pointer)
    expect(captureRestoreOrigin({ ...base, defaultTarget: null, pointer: null }).node).toBe(body)
  })

  it('ignores an inside pointer and an unfocusable default', () => {
    const body = node()
    const pointer = node()
    const snapshot = captureRestoreOrigin({
      active: body,
      body,
      defaultTarget: node(),
      pointer,
      isInside: candidate => candidate === pointer,
      isFocusable: () => false,
    })
    expect(snapshot.node).toBe(body)
  })

  it('falls back to an outside pointer when focus starts inside', () => {
    const active = node()
    const pointer = node()
    const snapshot = captureRestoreOrigin({
      active,
      body: node(),
      defaultTarget: null,
      pointer,
      isInside: candidate => candidate === active,
      isFocusable: () => true,
    })
    expect(snapshot.node).toBe(pointer)
  })
})

describe('resolveRestoreTarget', () => {
  const isFocusable = () => true
  const outside = () => false

  it('skips restore when the application already moved focus outside', () => {
    const target = resolveRestoreTarget({
      active: node(),
      body: node(),
      container: node(),
      explicit: null,
      captured: null,
      defaultTarget: null,
      isInside: outside,
      isFocusable,
      findProximity: () => null,
    })
    expect(target).toBeNull()
  })

  it('prefers explicit, then captured, then proximity, then default', () => {
    const body = node()
    const container = node()
    const explicit = node()
    const capturedNode = node()
    const captured: RestoreSnapshot = { node: capturedNode, parent: null, next: null, prev: null }
    const proximity = node()
    const defaultTarget = node()
    const base = {
      active: body,
      body,
      container,
      isInside: outside,
      isFocusable,
      findProximity: () => proximity,
    }
    expect(resolveRestoreTarget({ ...base, explicit, captured, defaultTarget })).toBe(explicit)
    expect(resolveRestoreTarget({ ...base, explicit: null, captured, defaultTarget })).toBe(
      capturedNode
    )
    const dead: RestoreSnapshot = {
      node: node({ isConnected: false }),
      parent: null,
      next: null,
      prev: null,
    }
    expect(resolveRestoreTarget({ ...base, explicit: null, captured: dead, defaultTarget })).toBe(
      proximity
    )
    expect(
      resolveRestoreTarget({
        ...base,
        explicit: null,
        captured: null,
        defaultTarget,
        findProximity: () => null,
      })
    ).toBe(defaultTarget)
    expect(
      resolveRestoreTarget({
        ...base,
        explicit: null,
        captured: null,
        defaultTarget: null,
        findProximity: () => null,
      })
    ).toBeNull()
  })

  it('falls back to the default when proximity finds nothing', () => {
    const body = node()
    const defaultTarget = node()
    const target = resolveRestoreTarget({
      active: body,
      body,
      container: node(),
      explicit: node({ isConnected: false }),
      captured: {
        node: node({ isConnected: false }),
        parent: null,
        next: null,
        prev: null,
      },
      defaultTarget,
      isInside: outside,
      isFocusable,
      findProximity: () => null,
    })
    expect(target).toBe(defaultTarget)
  })
})
