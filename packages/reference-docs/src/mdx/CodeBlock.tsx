import { useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef } from 'react'
import { Div, css } from '@reference-ui/react'
import { CopyButton, panelCode, panelFrame, panelSurface } from './codePanel'

/**
 * Fenced code block. Build-time highlighting (rehype-pretty-code + shiki) still
 * owns the tokens and the `{n-m}` line highlights; this layer puts the block in
 * the shared code panel and, when the source is tall and has no highlighted
 * lines, a collapsed "View Code" reveal.
 */

const COLLAPSED_MAX = '9.5rem'
const COLLAPSE_THRESHOLD = 232

const fade = css({
  position: 'absolute',
  left: '0',
  right: '0',
  bottom: '0',
  height: '8r',
  pointerEvents: 'none',
  backgroundImage: 'linear-gradient(to top, var(--colors-docs-code-bg), transparent)',
})

const overlay = css({
  position: 'absolute',
  inset: '0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
})

const viewCode = css({
  pointerEvents: 'auto',
  display: 'inline-flex',
  alignItems: 'center',
  height: '8r',
  paddingX: '4r',
  borderRadius: 'md',
  bg: 'docsPageBg',
  border: '1px solid',
  borderColor: 'docsBorder',
  color: 'docsText',
  fontSize: '0.8125rem',
  fontWeight: '500',
  cursor: 'pointer',
  boxShadow: 'sm',
  transition: 'background 0.15s ease',
  _hover: { bg: 'docsHoverBg' },
  _focusVisible: { outline: '2px solid', outlineColor: 'docsRing', outlineOffset: '2px' },
})

export function CodeBlock({ children, className, ...rest }: ComponentPropsWithoutRef<'pre'>) {
  const ref = useRef<HTMLPreElement>(null)
  const [collapsible, setCollapsible] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // Highlighted lines are the point of their block, so it never hides them.
    const highlighted = el.querySelector('[data-highlighted-line]') !== null
    const measure = () => setCollapsible(!highlighted && el.scrollHeight > COLLAPSE_THRESHOLD)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const collapsed = collapsible && !expanded

  return (
    <Div className={panelFrame}>
      <Div
        className={panelSurface}
        style={collapsed ? { maxHeight: COLLAPSED_MAX } : undefined}
      >
        <pre ref={ref} className={className ? `${panelCode} ${className}` : panelCode} {...rest}>
          {children}
        </pre>
        {collapsed ? <Div className={fade} /> : null}
        {collapsed ? (
          <Div className={overlay}>
            <button type="button" className={viewCode} onClick={() => setExpanded(true)}>
              View Code
            </button>
          </Div>
        ) : null}
        <CopyButton getText={() => ref.current?.innerText} />
      </Div>
    </Div>
  )
}
