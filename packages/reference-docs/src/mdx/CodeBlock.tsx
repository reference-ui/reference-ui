import { useEffect, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef } from 'react'
import { Div, css } from '@reference-ui/react'
import { CheckIcon, ContentCopyIcon } from '@reference-ui/lib'

/**
 * Fenced code block. Build-time highlighting (rehype-pretty-code + shiki) still
 * owns the tokens; this layer gives the block a flat panel, a hover copy button,
 * and — when the source is tall — a collapsed "View Code" reveal.
 */

const COLLAPSED_MAX = '9.5rem'
const COLLAPSE_THRESHOLD = 232

const frame = css({
  position: 'relative',
  marginBottom: '6r',
  _hover: {
    '& [data-copy]': { opacity: 1 },
  },
})

const surface = css({
  position: 'relative',
  bg: 'docsPanelBg',
  borderRadius: 'md',
  overflow: 'hidden',
  transition: 'max-height 0.24s ease',
})

const code = css({
  margin: '0',
  padding: '4r',
  fontSize: '0.8125rem',
  lineHeight: '1.65',
  fontFamily: 'mono',
  overflowX: 'auto',
})

const fade = css({
  position: 'absolute',
  left: '0',
  right: '0',
  bottom: '0',
  height: '8r',
  pointerEvents: 'none',
  background: 'linear-gradient(to top, var(--colors-docs-panel-bg), transparent)',
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

const copy = css({
  position: 'absolute',
  top: '2r',
  right: '2r',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '7r',
  height: '7r',
  padding: '0',
  borderRadius: 'sm',
  border: 'none',
  bg: 'transparent',
  color: 'docsMuted',
  cursor: 'pointer',
  opacity: '0',
  transition: 'opacity 0.15s ease, background 0.15s ease, color 0.15s ease',
  _hover: { bg: 'docsHoverBg', color: 'docsText' },
  _focusVisible: {
    opacity: '1',
    outline: '2px solid',
    outlineColor: 'docsRing',
    outlineOffset: '2px',
  },
})

export function CodeBlock({ children, className, ...rest }: ComponentPropsWithoutRef<'pre'>) {
  const ref = useRef<HTMLPreElement>(null)
  const [collapsible, setCollapsible] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setCollapsible(el.scrollHeight > COLLAPSE_THRESHOLD)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(id)
  }, [copied])

  const collapsed = collapsible && !expanded

  const onCopy = () => {
    const text = ref.current?.innerText
    if (!text) return
    void navigator.clipboard?.writeText(text).then(() => setCopied(true))
  }

  return (
    <Div className={frame}>
      <Div
        className={surface}
        style={collapsed ? { maxHeight: COLLAPSED_MAX } : undefined}
      >
        <pre ref={ref} className={className ? `${code} ${className}` : code} {...rest}>
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
        <button type="button" data-copy className={copy} aria-label="Copy code" onClick={onCopy}>
          {copied ? <CheckIcon /> : <ContentCopyIcon />}
        </button>
      </Div>
    </Div>
  )
}
