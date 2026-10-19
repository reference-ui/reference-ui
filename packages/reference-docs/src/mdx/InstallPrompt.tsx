// AI-agent install card with copyable prompt.
// It takes nothing and emits the label, primary Copy prompt button, and the collapsed
// read-only disclosure. The prompt is the repo-root INSTALL.md imported ?raw at build time.
import { useEffect, useId, useState, type MouseEvent } from 'react'
import { Div, css } from '@reference-ui/react'
import { CheckIcon, ContentCopyIcon, VisibilityIcon, VisibilityOffIcon } from '@reference-ui/lib'
import installPrompt from '../../../../INSTALL.md?raw'

/**
 * The AI-agent install prompt as a compact card, styled like the code panels.
 * Clicking anywhere on the bar copies the prompt; only "View" opens it.
 * "Copy" is the primary button and stays that way, except while "View" is
 * hovered, when the two swap looks. The text is the
 * repo-root `INSTALL.md`, read at build time.
 */

// Literal values throughout: the build-time extractor does not follow spreads
// of shared style objects into nested selectors.
const card = css({
  marginBottom: '8r',
  border: '1px solid',
  borderColor: 'docsBorder',
  borderRadius: 'md',
  overflow: 'hidden',
  bg: 'docsCodeBg',
})

const bar = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2r',
  minHeight: '14r',
  paddingY: '2r',
  paddingLeft: '4r',
  paddingRight: '2r',
  cursor: 'pointer',
  // Copy is primary; only hovering View hands the primary look over.
  '&:has([data-view-prompt]:hover) [data-copy-prompt]': {
    bg: 'docsPageBg',
    color: 'docsText',
    borderColor: 'docsBorder',
  },
})

const label = css({
  flex: '1',
  minWidth: '0',
  color: 'docsText',
  fontSize: '0.875rem',
  fontWeight: '500',
})

const button = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1.5r',
  height: '8r',
  paddingLeft: '2.5r',
  paddingRight: '3r',
  border: '1px solid',
  borderRadius: 'md',
  fontFamily: 'inherit',
  fontSize: '0.8125rem',
  fontWeight: '500',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
  _focusVisible: { outline: '2px solid', outlineColor: 'docsRing', outlineOffset: '2px' },
})

const viewButton = css({
  bg: 'docsPageBg',
  color: 'docsText',
  borderColor: 'docsBorder',
  _hover: { bg: 'docsText', color: 'docsPageBg', borderColor: 'docsText' },
})

const copyButton = css({
  bg: 'docsText',
  color: 'docsPageBg',
  borderColor: 'docsText',
  minWidth: '18r',
})

const promptText = css({
  margin: '0',
  maxHeight: '20rem',
  overflow: 'auto',
  paddingX: '4r',
  paddingY: '3r',
  borderTop: '1px solid',
  borderTopColor: 'docsBorder',
  color: 'docsMuted',
  fontFamily: 'mono',
  fontSize: '0.75rem',
  lineHeight: '1.65',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
  cursor: 'text',
})

export function InstallPrompt() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const panelId = useId()

  useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 1800)
    return () => window.clearTimeout(id)
  }, [copied])

  const onCopy = () => {
    navigator.clipboard
      ?.writeText(installPrompt)
      .then(() => setCopied(true))
      .catch(() => {
        // Clipboard blocked: show the text so it can be copied by hand.
        setOpen(true)
      })
  }

  // Copy is the default: a click anywhere on the bar copies, including the
  // Copy button's own (it bubbles). Only View toggles, so it stops there.
  const onViewClick = (event: MouseEvent) => {
    event.stopPropagation()
    setOpen(value => !value)
  }

  return (
    <Div className={card}>
      <Div className={bar} onClick={onCopy}>
        <Div className={label}>Install with an AI agent</Div>
        <button
          type="button"
          data-view-prompt
          className={`${button} ${viewButton}`}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onViewClick}
        >
          {open ? <VisibilityOffIcon size="sm" /> : <VisibilityIcon size="sm" />}
          {open ? 'Hide' : 'View'}
        </button>
        <button type="button" data-copy-prompt className={`${button} ${copyButton}`}>
          {copied ? <CheckIcon size="sm" /> : <ContentCopyIcon size="sm" />}
          <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </Div>
      <pre id={panelId} className={promptText} hidden={!open}>
        {installPrompt.trim()}
      </pre>
    </Div>
  )
}
