/**
 * Splitter root: a controlled resizable panel group that composes the
 * direction, registry, measurement, separator, collapse, keyboard,
 * pointer, and structure hooks, then publishes them as context for Panel,
 * Handle, and Thumb. It owns the live callback mirror, the session refs
 * shared across hooks, the dev-only layout diagnostics, and the indexed
 * size variables — every other behavior lives in its hook.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { validateLayout, validatePanelConstraints } from './math/splitter-math'
import { SPLITTER_STYLES } from './styles/splitter-styles'
import { SplitterContext, SplitterHandleContext, type SplitterContextValue } from './context'
import type { SplitterProps } from './types'
import { isProductionEnv, warnSplitter } from './shared/warn'
import { rootSizeVar } from './shared/geometry'
import { usePartRegistry } from './hooks/use-part-registry'
import { useDirection } from './hooks/use-direction'
import { useMeasuredTable } from './hooks/use-measured-table'
import { useSeparatorModel, type SessionFreeze } from './hooks/use-separator-model'
import { useCollapseMemory } from './hooks/use-collapse-memory'
import { useKeyboardResize } from './hooks/use-keyboard-resize'
import { usePointerResize, type ActivePointerSession } from './hooks/use-pointer-resize'
import { useStructureCheck } from './hooks/use-structure-check'
import { SplitterPanel } from './parts/Panel'
import { SplitterHandle } from './parts/Handle'
import { SplitterThumb } from './parts/Thumb'

export type {
  SplitterHandleContextValue,
  SplitterHandleProps,
  SplitterOrientation,
  SplitterPanelProps,
  SplitterProps,
  SplitterSeparatorAria,
  SplitterThumbProps,
} from './types'
export { SplitterHandleContext }
export { SplitterPanel, SplitterHandle, SplitterThumb }

export const Splitter = React.forwardRef<HTMLDivElement, SplitterProps>(
  function Splitter(
    {
      children,
      orientation = 'horizontal',
      value,
      onChange,
      onChangeEnd,
      className,
      style,
      ...props
    },
    forwardedRef
  ) {
    const containerRef = React.useRef<HTMLDivElement | null>(null)

    // Sessions outlive renders: callbacks and value stay live through this
    // ref so mid-gesture swaps apply to the captured origin. Numeric
    // constraints stay live through panelsRef; measured strings stay
    // captured (SP-CTRL-05 vs SP-PERF-06).
    const latestRef = React.useRef({ value, onChange, onChangeEnd })
    latestRef.current = { value, onChange, onChangeEnd }

    // FEATURES #5: while a pointer session is active, separator ARIA and
    // blocked flags are frozen at their pointerdown values — no per-move
    // ARIA writes even when the parent accepts every candidate.
    const sessionFreezeRef = React.useRef<SessionFreeze | null>(null)
    const activeSessionRef = React.useRef<ActivePointerSession | null>(null)

    const { isRtl, updateDir } = useDirection(containerRef, orientation)
    const registry = usePartRegistry()
    const { panelsRef, handlesRef, partsRevision } = registry

    const isSessionActive = React.useCallback(() => activeSessionRef.current !== null, [])
    const measured = useMeasuredTable({
      containerRef,
      panelsRef,
      handlesRef,
      orientation,
      isSessionActive,
    })
    const { panelConstraints } = measured

    if (!isProductionEnv()) {
      // Count mismatches throw structurally (FEATURES #9); this warns only
      // for malformed entries and off-100 totals.
      const layoutCheck = validateLayout(value)
      if (!layoutCheck.valid && layoutCheck.error) warnSplitter(layoutCheck.error)
      // Raw props, so invalid measured strings warn with a
      // property-specific diagnostic while the solver ignores them.
      const constraintCheck = validatePanelConstraints(
        panelsRef.current.map((panel) => ({
          id: panel.id,
          min: panel.min,
          max: panel.max,
          collapsible: panel.collapsible,
          collapsedSize: panel.collapsedSize,
        }))
      )
      if (!constraintCheck.valid && constraintCheck.error) warnSplitter(constraintCheck.error)
    }

    const separator = useSeparatorModel({
      value,
      panelConstraints,
      isRtl,
      partsRevision,
      panelsRef,
      handlesRef,
      sessionFreezeRef,
    })
    const rememberedSizesRef = useCollapseMemory(value, panelsRef)
    const keyboard = useKeyboardResize({
      value,
      panelConstraints,
      orientation,
      isRtl,
      onChange,
      latestRef,
      panelsRef,
      handlesRef,
      rememberedSizesRef,
      primaryPanelIndex: separator.primaryPanelIndex,
      isHandleBlocked: separator.isHandleBlocked,
    })
    const pointer = usePointerResize({
      containerRef,
      value,
      orientation,
      updateDir,
      measureAvailable: measured.measureAvailable,
      resolveMeasuredTable: measured.resolveMeasuredTable,
      publishMeasuredTable: measured.publishMeasuredTable,
      isHandleBlocked: separator.isHandleBlocked,
      cancelKeyboardSession: keyboard.cancelKeyboardSession,
      latestRef,
      panelsRef,
      handlesRef,
      sessionFreezeRef,
      activeSessionRef,
    })

    const handleRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        containerRef.current = node
        if (typeof forwardedRef === 'function') {
          forwardedRef(node)
        } else if (forwardedRef) {
          ;(forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node
        }
      },
      [forwardedRef]
    )

    const structureError = useStructureCheck(value, panelsRef, handlesRef)
    if (structureError) {
      throw new Error(`[Reference UI Splitter] ${structureError}`)
    }

    const contextValue = React.useMemo<SplitterContextValue>(() => {
      // Re-publish after every (un)registration so parts re-read DOM order.
      void partsRevision
      return {
        orientation,
        value,
        isRtl,
        isResizing: pointer.isResizing,
        resizingHandleIndex: pointer.resizingHandleIndex,
        panelConstraints,
        primaryPanelIndex: separator.primaryPanelIndex,
        getPanelId: separator.getPanelId,
        getPanelIndex: registry.getPanelIndex,
        getHandleIndex: registry.getHandleIndex,
        registerPanel: registry.registerPanel,
        registerHandle: registry.registerHandle,
        getSeparatorAria: separator.getSeparatorAria,
        isHandleBlocked: separator.isHandleBlocked,
        cancelOwnedSession: pointer.cancelOwnedSession,
        cancelKeyboardSession: keyboard.cancelKeyboardSession,
        onHandlePointerDown: pointer.onHandlePointerDown,
        onHandleKeyDown: keyboard.onHandleKeyDown,
        onHandleKeyUp: keyboard.onHandleKeyUp,
      }
    }, [
      orientation,
      value,
      isRtl,
      pointer.isResizing,
      pointer.resizingHandleIndex,
      panelConstraints,
      separator.primaryPanelIndex,
      separator.getPanelId,
      registry.getPanelIndex,
      registry.getHandleIndex,
      registry.registerPanel,
      registry.registerHandle,
      separator.getSeparatorAria,
      separator.isHandleBlocked,
      pointer.cancelOwnedSession,
      keyboard.cancelKeyboardSession,
      pointer.onHandlePointerDown,
      keyboard.onHandleKeyDown,
      keyboard.onHandleKeyUp,
      partsRevision,
    ])

    // FEATURES #4: indexed size signals in Panel order. Owned, so they
    // come after consumer style; unrelated custom properties pass through.
    const rootStyle = {
      ...style,
      ...Object.fromEntries(value.map((size, panelIndex) => [rootSizeVar(panelIndex), `${size}%`])),
    } as React.CSSProperties

    return (
      <SplitterContext.Provider value={contextValue}>
        <Div
          ref={handleRef}
          data-reference-splitter=""
          data-orientation={orientation}
          data-resizing={pointer.isResizing ? '' : undefined}
          display="flex"
          flexDirection={orientation === 'vertical' ? 'column' : 'row'}
          width="100%"
          height="100%"
          overflow="hidden"
          className={className}
          style={rootStyle}
          {...props}
        >
          <style>{SPLITTER_STYLES}</style>
          {children}
        </Div>
      </SplitterContext.Provider>
    )
  }
) as React.ForwardRefExoticComponent<SplitterProps & React.RefAttributes<HTMLDivElement>> & {
  Panel: typeof SplitterPanel
  Handle: typeof SplitterHandle
  Thumb: typeof SplitterThumb
}

Splitter.Panel = SplitterPanel
Splitter.Handle = SplitterHandle
Splitter.Thumb = SplitterThumb
