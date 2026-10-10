/**
 * Grace-polygon travel tracking while a submenu is open: inside and
 * grace samples cancel the close timer, leave samples arm the frozen
 * 300ms close once per away episode, and travel inside an open
 * descendant keeps every ancestor open. Takes the open flag, intent
 * state, parent level, content id, and level value; the level reads
 * stay live through a ref mirror so deps stay exactly the originals.
 */
import * as React from 'react'
import type { MenuLevelValue } from '../context'
import type { SubmenuIntentState } from '../levels/intent-state'
import { clearIntentTimer } from '../levels/intent-state'
import { isLevelDescendantOf, levelDirection } from '../levels/registry'
import { hoverCapablePointer, submenuSide } from '../shared/pointer'
import {
  asRect as intentAsRect,
  evaluateSubmenuIntent,
  pointInRect as intentPointInRect,
  SUBMENU_CLOSE_DELAY_MS,
  SUBMENU_SAFE_PADDING,
  type Side as IntentSide,
} from '../intent/menu-intent'

export function useIntentTravel({ isOpen, intent, parentLevel, contentId, levelValue }: {
  isOpen: boolean
  intent: SubmenuIntentState
  parentLevel: MenuLevelValue
  contentId: string
  levelValue: MenuLevelValue
}) {
  const levelRef = React.useRef(levelValue)
  levelRef.current = levelValue
  const travelOpenRef = React.useRef(isOpen)
  travelOpenRef.current = isOpen
  // Grace-polygon travel tracking while open. Inside/grace samples cancel
  // the close timer; leave samples arm the frozen 300ms close once per away
  // episode, so a rejected close never spams while the pointer rests outside.
  // Travel inside an open descendant keeps every ancestor open (COMP-03).
  React.useEffect(() => {
    if (!isOpen) return
    const doc =
      levelRef.current.getContentNode()?.ownerDocument ??
      levelRef.current.getTrigger()?.ownerDocument ??
      (typeof document !== 'undefined' ? document : null)
    if (!doc) return
    const onMove = (event: PointerEvent) => {
      if (!hoverCapablePointer(event.pointerType, event.pressure)) return
      const trigger = levelRef.current.getTrigger()
      const content = levelRef.current.getContentNode()
      if (!trigger || !content) return
      const registry = parentLevel.registry
      let inDescendant = false
      for (const reg of registry.values()) {
        if (!reg.isOpen || reg.id === contentId) continue
        if (!isLevelDescendantOf(registry, reg.id, contentId)) continue
        const nodeTrigger = reg.getTrigger()
        const nodeContent = reg.getContent()
        if (
          (nodeTrigger &&
            intentPointInRect(
              event.clientX,
              event.clientY,
              intentAsRect(nodeTrigger.getBoundingClientRect()),
              SUBMENU_SAFE_PADDING
            )) ||
          (nodeContent &&
            intentPointInRect(
              event.clientX,
              event.clientY,
              intentAsRect(nodeContent.getBoundingClientRect()),
              SUBMENU_SAFE_PADDING
            ))
        ) {
          inDescendant = true
          break
        }
      }
      const prev = intent.prevSample ?? undefined
      intent.prevSample = { x: event.clientX, y: event.clientY, timestamp: event.timeStamp }
      if (inDescendant) {
        clearIntentTimer(intent, 'closeTimer')
        intent.closeRequested = false
        return
      }
      const fallback: IntentSide = levelDirection(parentLevel) === 'rtl' ? 'left' : 'right'
      const decision = evaluateSubmenuIntent({
        currentPoint: [event.clientX, event.clientY],
        triggerRect: intentAsRect(trigger.getBoundingClientRect()),
        contentRect: intentAsRect(content.getBoundingClientRect()),
        side: submenuSide(content, fallback),
        leavePoint: intent.leavePoint ?? undefined,
        prevSample: prev,
      })
      if (decision === 'leave') {
        if (!intent.closeTimer && !intent.closeRequested) {
          intent.closeTimer = setTimeout(() => {
            intent.closeTimer = null
            intent.closeRequested = true
            if (travelOpenRef.current) levelRef.current.requestClose()
          }, SUBMENU_CLOSE_DELAY_MS)
        }
      } else {
        clearIntentTimer(intent, 'closeTimer')
        intent.closeRequested = false
      }
    }
    doc.addEventListener('pointermove', onMove, true)
    return () => doc.removeEventListener('pointermove', onMove, true)
  }, [isOpen, intent, parentLevel, contentId])
}
