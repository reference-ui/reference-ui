// Tabbed container grouping related code blocks.
// It takes labels plus children and emits the tab chrome; useInCodeTabs lets nested blocks
// adapt to their group.
import {
  Children,
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { Div, css } from '@reference-ui/react'
import { CopyButton, panelFrame, panelSurface } from './codePanel'

/**
 * Tabs over fenced code blocks, one label per block, in the same panel as
 * `Install`. A fenced block inside reads `useInCodeTabs()` and renders bare,
 * so the tab row and the code share one frame.
 *
 *   <CodeTabs labels={['Claude Code', 'Cursor']}>
 *   ```bash
 *   claude mcp add …
 *   ```
 *   ```json
 *   { … }
 *   ```
 *   </CodeTabs>
 */

const InCodeTabs = createContext(false)

/** True inside `CodeTabs`, where a code block skips its own frame. */
export function useInCodeTabs(): boolean {
  return useContext(InCodeTabs)
}

const tabList = css({
  display: 'flex',
  gap: '1r',
  paddingX: '2r',
  paddingRight: '11r',
  // Scrolls sideways on narrow screens; never vertically.
  overflowX: 'auto',
  overflowY: 'hidden',
  borderBottom: '1px solid',
  borderBottomColor: 'docsBorder',
})

const tab = css({
  position: 'relative',
  flexShrink: '0',
  height: '10r',
  paddingX: '2r',
  border: 'none',
  bg: 'transparent',
  color: 'docsMuted',
  fontFamily: 'inherit',
  fontSize: '0.875rem',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: 'color 0.15s ease',
  _hover: { color: 'docsText' },
  _focusVisible: { outline: '2px solid', outlineColor: 'docsRing', outlineOffset: '-4px' },
  '&[aria-selected="true"]': {
    color: 'docsText',
    fontWeight: '500',
    _after: {
      content: '""',
      position: 'absolute',
      left: '2r',
      right: '2r',
      bottom: '0',
      height: '2px',
      bg: 'docsAccent',
    },
  },
})

// Centres the 28px copy button in the 40px tab row, where it stays visible.
const TAB_ROW_COPY = { top: '0.375rem', opacity: 1 }

type CodeTabsProps = {
  labels: string[]
  children: ReactNode
}

export function CodeTabs({ labels, children }: CodeTabsProps) {
  const [selected, setSelected] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)
  const id = useId()
  const panels = Children.toArray(children)

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (step === 0) return
    const next = (selected + step + labels.length) % labels.length
    setSelected(next)
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-index="${next}"]`)?.focus()
  }

  return (
    <Div className={panelFrame}>
      <Div className={panelSurface}>
        <Div role="tablist" className={tabList} onKeyDown={onKeyDown}>
          {labels.map((label, index) => (
            <button
              key={label}
              type="button"
              role="tab"
              id={`${id}-tab-${index}`}
              data-index={index}
              aria-selected={index === selected}
              aria-controls={`${id}-panel`}
              tabIndex={index === selected ? 0 : -1}
              className={tab}
              onClick={() => setSelected(index)}
            >
              {label}
            </button>
          ))}
        </Div>
        <CopyButton
          getText={() => panelRef.current?.querySelector('pre')?.innerText}
          style={TAB_ROW_COPY}
        />
        <Div
          ref={panelRef}
          role="tabpanel"
          id={`${id}-panel`}
          aria-labelledby={`${id}-tab-${selected}`}
        >
          <InCodeTabs.Provider value={true}>{panels[selected]}</InCodeTabs.Provider>
        </Div>
      </Div>
    </Div>
  )
}
