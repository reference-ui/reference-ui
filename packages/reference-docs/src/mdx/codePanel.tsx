// Shared code-panel look: frame, surface, code, and copy button.
// It takes nothing and emits the hairline frame, tinted surface, and CopyButton recipe every
// code block and install tab composes. Highlight and reveal behavior lives in CodeBlock.
import { useEffect, useState, type CSSProperties } from 'react'
import { css } from '@reference-ui/react'
import { CheckIcon, ContentCopyIcon } from '@reference-ui/lib'

/**
 * The shared look of every code panel: fenced blocks (`CodeBlock`) and the
 * package-manager `Install` block. A hairline border on a fill one shade off
 * the page, a small radius, and a copy button that appears on hover (and
 * always on touch screens, which have no hover: see `docs-syntax.css`).
 */

export const panelFrame = css({
  position: 'relative',
  marginBottom: '6r',
  _hover: {
    '& [data-copy]': { opacity: 1 },
  },
})

export const panelSurface = css({
  position: 'relative',
  bg: 'docsCodeBg',
  border: '1px solid',
  borderColor: 'docsBorder',
  borderRadius: 'md',
  overflow: 'hidden',
})

/** Code text; horizontal padding lives on each line so highlights run edge to edge. */
export const panelCode = css({
  margin: '0',
  paddingY: '3r',
  fontSize: '0.8125rem',
  lineHeight: '1.7',
  fontFamily: 'mono',
  overflowX: 'auto',
})

const copyButton = css({
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
  bg: 'docsCodeBg',
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

type CopyButtonProps = {
  getText: () => string | undefined
  /** Placement override, e.g. to sit in a tab row instead of over the code. */
  style?: CSSProperties
}

export function CopyButton({ getText, style }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(id)
  }, [copied])

  const onCopy = () => {
    const text = getText()
    if (!text) return
    void navigator.clipboard?.writeText(text).then(() => setCopied(true))
  }

  return (
    <button
      type="button"
      data-copy
      className={copyButton}
      style={style}
      aria-label="Copy code"
      onClick={onCopy}
    >
      {copied ? <CheckIcon /> : <ContentCopyIcon />}
    </button>
  )
}
