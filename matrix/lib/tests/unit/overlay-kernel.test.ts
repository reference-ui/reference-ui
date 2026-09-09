// @vitest-environment happy-dom
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { resolveIsolation } from '../../../../packages/reference-lib/src/components/Overlay/types'
import {
  CLOSE_THRESHOLD,
  VELOCITY_THRESHOLD,
  dismissDelta,
  axisSize,
  swipeProgress,
  shouldDismiss,
  swipeTransform,
  sampleVelocity,
} from '../../../../packages/reference-lib/src/components/Overlay/gesture'
import {
  eventPath,
  isEventInside,
  isNodeInside,
  closestFromEvent,
  isPrimaryPointer,
  markEventConsumed,
  isEventConsumed,
} from '../../../../packages/reference-lib/src/components/Overlay/shared/events'
import {
  overlayStackStore,
  descendantsDeepestFirst,
  getTopLiveLayer,
  isLayerPointerEventsEnabled,
  setLayerHandlers,
} from '../../../../packages/reference-lib/src/components/Overlay/stack'

describe('Overlay Kernel Unit Contracts', () => {
  describe('resolveIsolation', () => {
    it('defaults to all true when omitted or true', () => {
      expect(resolveIsolation()).toEqual({ focus: true, inert: true, scroll: true })
      expect(resolveIsolation(true)).toEqual({ focus: true, inert: true, scroll: true })
    })

    it('returns all false when false', () => {
      expect(resolveIsolation(false)).toEqual({ focus: false, inert: false, scroll: false })
    })

    it('patches true bundle when given an object', () => {
      expect(resolveIsolation({ scroll: false })).toEqual({
        focus: true,
        inert: true,
        scroll: false,
      })
      expect(resolveIsolation({ focus: false, inert: true, scroll: true })).toEqual({
        focus: false,
        inert: true,
        scroll: true,
      })
      expect(resolveIsolation({ inert: false })).toEqual({
        focus: true,
        inert: false,
        scroll: true,
      })
      expect(resolveIsolation({})).toEqual({
        focus: true,
        inert: true,
        scroll: true,
      })
    })
  })

  describe('Handle gesture thresholds & velocity', () => {
    it('freezes CLOSE_THRESHOLD at 0.25 (25%) and VELOCITY_THRESHOLD at 0.4 px/ms', () => {
      expect(CLOSE_THRESHOLD).toBe(0.25)
      expect(VELOCITY_THRESHOLD).toBe(0.4)
    })

    it('dismissDelta computes positive directional delta according to edge', () => {
      expect(dismissDelta('bottom', 10, 50)).toBe(50)
      expect(dismissDelta('bottom', 10, -50)).toBe(0)

      expect(dismissDelta('top', 10, -50)).toBe(50)
      expect(dismissDelta('top', 10, 50)).toBe(0)

      expect(dismissDelta('right', 50, 10)).toBe(50)
      expect(dismissDelta('right', -50, 10)).toBe(0)

      expect(dismissDelta('left', -50, 10)).toBe(50)
      expect(dismissDelta('left', 50, 10)).toBe(0)
    })

    it('axisSize returns width for horizontal edges and height for vertical edges', () => {
      expect(axisSize('bottom', 300, 500)).toBe(500)
      expect(axisSize('top', 300, 500)).toBe(500)
      expect(axisSize('left', 300, 500)).toBe(300)
      expect(axisSize('right', 300, 500)).toBe(300)
    })

    it('swipeProgress returns clamped fraction 0..1', () => {
      expect(swipeProgress(100, 400)).toBe(0.25)
      expect(swipeProgress(500, 400)).toBe(1)
      expect(swipeProgress(0, 400)).toBe(0)
      expect(swipeProgress(100, 0)).toBe(0)
    })

    it('shouldDismiss triggers at 25% distance or 0.4px/ms velocity', () => {
      // Below both
      expect(shouldDismiss(0.24, 0.3)).toBe(false)
      // At or above progress threshold
      expect(shouldDismiss(0.25, 0)).toBe(true)
      expect(shouldDismiss(0.3, 0.1)).toBe(true)
      // Above velocity threshold even with low progress
      expect(shouldDismiss(0.05, 0.41)).toBe(true)
      expect(shouldDismiss(0.1, 0.8)).toBe(true)
    })

    it('swipeTransform generates single-axis translate', () => {
      expect(swipeTransform('bottom', 100)).toBe('translateY(100px)')
      expect(swipeTransform('top', 100)).toBe('translateY(-100px)')
      expect(swipeTransform('right', 100)).toBe('translateX(100px)')
      expect(swipeTransform('left', 100)).toBe('translateX(-100px)')
    })

    it('sampleVelocity calculates directional speed from event history', () => {
      const history = [
        { time: 100, x: 0, y: 0 },
        { time: 200, x: 0, y: 100 },
      ]
      // dy = 100, dt = 100 -> velocity = 1.0 px/ms
      expect(sampleVelocity(history, 'bottom')).toBe(1.0)
      expect(sampleVelocity(history, 'top')).toBe(0) // moved down, not up
      expect(sampleVelocity([], 'bottom')).toBe(0)
    })
  })

  describe('composedPath & event containment', () => {
    it('eventPath falls back through parentNode walk when composedPath is absent', () => {
      const parent = document.createElement('div')
      const child = document.createElement('button')
      parent.appendChild(child)
      document.body.appendChild(parent)

      const event = new MouseEvent('click')
      Object.defineProperty(event, 'target', { value: child })
      Object.defineProperty(event, 'composedPath', { value: undefined })

      const path = eventPath(event)
      expect(path).toContain(child)
      expect(path).toContain(parent)
      expect(path).toContain(document.body)
      expect(path).toContain(document)

      document.body.removeChild(parent)
    })

    it('isEventInside accurately determines whether an event originated in container', () => {
      const container = document.createElement('div')
      const inner = document.createElement('span')
      const outside = document.createElement('button')
      container.appendChild(inner)
      document.body.appendChild(container)
      document.body.appendChild(outside)

      inner.addEventListener('click', e => {
        expect(isEventInside(container, e)).toBe(true)
      })
      inner.dispatchEvent(new MouseEvent('click', { bubbles: true }))

      outside.addEventListener('click', e => {
        expect(isEventInside(container, e)).toBe(false)
        expect(isEventInside(null, e)).toBe(false)
      })
      outside.dispatchEvent(new MouseEvent('click', { bubbles: true }))

      document.body.removeChild(container)
      document.body.removeChild(outside)
    })

    it('isNodeInside traverses ShadowRoot boundaries', () => {
      const host = document.createElement('div')
      document.body.appendChild(host)
      const shadow = host.attachShadow({ mode: 'open' })
      const innerEl = document.createElement('div')
      shadow.appendChild(innerEl)

      expect(isNodeInside(host, innerEl)).toBe(true)
      expect(isNodeInside(innerEl, host)).toBe(false)

      document.body.removeChild(host)
    })

    it('closestFromEvent finds closest matching selector in event path', () => {
      const parent = document.createElement('div')
      parent.setAttribute('data-target', 'parent')
      const child = document.createElement('span')
      parent.appendChild(child)

      const event = new MouseEvent('click')
      Object.defineProperty(event, 'target', { value: child })
      Object.defineProperty(event, 'composedPath', {
        value: () => [child, parent, document.body, document],
      })

      expect(closestFromEvent(event, '[data-target="parent"]')).toBe(parent)
      expect(closestFromEvent(event, '.nonexistent')).toBeNull()
    })

    it('isPrimaryPointer rejects non-primary or right clicks', () => {
      const leftClick = { button: 0, isPrimary: true } as PointerEvent
      const rightClick = { button: 2, isPrimary: true } as PointerEvent
      const nonPrimary = { button: 0, isPrimary: false } as PointerEvent

      expect(isPrimaryPointer(leftClick)).toBe(true)
      expect(isPrimaryPointer(rightClick)).toBe(false)
      expect(isPrimaryPointer(nonPrimary)).toBe(false)
    })

    it('markEventConsumed and isEventConsumed track consumed events in WeakSet', () => {
      const event = new MouseEvent('click')
      expect(isEventConsumed(event)).toBe(false)
      markEventConsumed(event)
      expect(isEventConsumed(event)).toBe(true)
    })
  })

  describe('Stack cascade & layer management', () => {
    beforeEach(() => {
      overlayStackStore.getState().reset()
    })

    it('adds layers with staggered z-indices', () => {
      overlayStackStore.getState().addLayer({
        id: 'layer-1',
        parentId: null,
        dismiss: vi.fn(),
        isModal: true,
        isolation: { focus: true, inert: true, scroll: true },
        open: true,
        node: null,
        backdrop: null,
        trigger: null,
        document,
      })
      overlayStackStore.getState().addLayer({
        id: 'layer-2',
        parentId: 'layer-1',
        dismiss: vi.fn(),
        isModal: true,
        isolation: { focus: true, inert: true, scroll: true },
        open: true,
        node: null,
        backdrop: null,
        trigger: null,
        document,
      })

      const layers = overlayStackStore.getState().layers
      expect(layers).toHaveLength(2)
      expect(layers[0]!.zIndex).toBe(100)
      expect(layers[1]!.zIndex).toBe(110)
    })

    it('descendantsDeepestFirst orders children deepest-first', () => {
      const root = { id: 'root', parentId: null } as any
      const child1 = { id: 'child-1', parentId: 'root' } as any
      const grandchild1 = { id: 'grandchild-1', parentId: 'child-1' } as any
      const child2 = { id: 'child-2', parentId: 'root' } as any

      const layers = [root, child1, grandchild1, child2]
      const order = descendantsDeepestFirst(layers, 'root').map(l => l.id)
      expect(order).toEqual(['grandchild-1', 'child-1', 'child-2'])
    })

    it('cascade closes descendants deepest-first', () => {
      const calls: string[] = []
      const dismissChild = vi.fn(() => calls.push('child'))
      const dismissGrandchild = vi.fn(() => calls.push('grandchild'))

      overlayStackStore.getState().addLayer({
        id: 'parent',
        parentId: null,
        dismiss: vi.fn(),
        isModal: true,
        isolation: { focus: true, inert: true, scroll: true },
        open: true,
        node: null,
        backdrop: null,
        trigger: null,
        document,
      })
      overlayStackStore.getState().addLayer({
        id: 'child',
        parentId: 'parent',
        dismiss: dismissChild,
        isModal: true,
        isolation: { focus: true, inert: true, scroll: true },
        open: true,
        node: null,
        backdrop: null,
        trigger: null,
        document,
      })
      overlayStackStore.getState().addLayer({
        id: 'grandchild',
        parentId: 'child',
        dismiss: dismissGrandchild,
        isModal: true,
        isolation: { focus: true, inert: true, scroll: true },
        open: true,
        node: null,
        backdrop: null,
        trigger: null,
        document,
      })

      setLayerHandlers('child', { dismiss: dismissChild })
      setLayerHandlers('grandchild', { dismiss: dismissGrandchild })

      overlayStackStore.getState().cascade('parent')
      expect(calls).toEqual(['grandchild', 'child'])
    })

    it('getTopLiveLayer returns topmost open layer', () => {
      overlayStackStore.getState().addLayer({
        id: 'layer-1',
        parentId: null,
        dismiss: vi.fn(),
        isModal: true,
        isolation: { focus: true, inert: true, scroll: true },
        open: true,
        node: null,
        backdrop: null,
        trigger: null,
        document,
      })
      overlayStackStore.getState().addLayer({
        id: 'layer-2',
        parentId: 'layer-1',
        dismiss: vi.fn(),
        isModal: false,
        isolation: { focus: false, inert: false, scroll: false },
        open: false,
        node: null,
        backdrop: null,
        trigger: null,
        document,
      })

      expect(getTopLiveLayer(overlayStackStore.getState().layers, document)?.id).toBe('layer-1')
    })

    it('isLayerPointerEventsEnabled allows topmost modal and its descendants, blocks parents', () => {
      const nodeParent = document.createElement('div')
      const nodeChild = document.createElement('div')

      overlayStackStore.getState().addLayer({
        id: 'parent',
        parentId: null,
        dismiss: vi.fn(),
        isModal: true,
        isolation: { focus: true, inert: true, scroll: true },
        open: true,
        node: nodeParent,
        backdrop: null,
        trigger: null,
        document,
      })
      overlayStackStore.getState().addLayer({
        id: 'child',
        parentId: 'parent',
        dismiss: vi.fn(),
        isModal: true,
        isolation: { focus: true, inert: true, scroll: true },
        open: true,
        node: nodeChild,
        backdrop: null,
        trigger: null,
        document,
      })

      const layers = overlayStackStore.getState().layers
      // Topmost modal is child: child is enabled, parent is disabled
      expect(isLayerPointerEventsEnabled(layers, 'child', document)).toBe(true)
      expect(isLayerPointerEventsEnabled(layers, 'parent', document)).toBe(false)
    })

    it('getTopLiveLayer keeps independent documents from stealing Escape routing', () => {
      const otherDoc = document.implementation.createHTMLDocument('frame')
      overlayStackStore.getState().addLayer({
        id: 'main',
        parentId: null,
        dismiss: vi.fn(),
        isModal: true,
        isolation: { focus: true, inert: true, scroll: true },
        open: true,
        node: null,
        backdrop: null,
        trigger: null,
        document,
      })
      overlayStackStore.getState().addLayer({
        id: 'frame',
        parentId: null,
        dismiss: vi.fn(),
        isModal: true,
        isolation: { focus: true, inert: true, scroll: true },
        open: true,
        node: null,
        backdrop: null,
        trigger: null,
        document: otherDoc,
      })
      overlayStackStore.getState().addLayer({
        id: 'exiting',
        parentId: null,
        dismiss: vi.fn(),
        isModal: true,
        isolation: { focus: true, inert: true, scroll: true },
        open: false,
        node: null,
        backdrop: null,
        trigger: null,
        document,
      })

      const layers = overlayStackStore.getState().layers
      expect(getTopLiveLayer(layers, document)?.id).toBe('main')
      expect(getTopLiveLayer(layers, otherDoc)?.id).toBe('frame')
    })
  })
})
