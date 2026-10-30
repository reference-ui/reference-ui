// Docs product wordmark for the shell chrome.
// It takes nothing and emits the Reference UI brand lockup.
import { Link } from '@tanstack/react-router'
import { Span, css } from '@reference-ui/react'

/**
 * Product wordmark for the sidebar header and mobile topbar. Text only, so it
 * can sit flush with the navigation below it. Links home.
 */
const brandLink = css({
  display: 'inline-flex',
  alignItems: 'center',
  textDecoration: 'none',
  borderRadius: 'md',
})

export function Brand() {
  return (
    <Link to="/" className={brandLink} aria-label="Reference UI docs home">
      <Span fontSize="4r" weight="sans.semibold" letterSpacing="-0.01em" color="docsText">
        Reference UI
      </Span>
    </Link>
  )
}
