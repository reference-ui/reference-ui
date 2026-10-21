// Card grid for page-level navigation links.
// They take hrefs plus titles and emit the LinkCards group and LinkCard entries MDX pages
// use for next-step links. A card href may carry a #section hash, which the router keeps.
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Div, css } from '@reference-ui/react'
import { ArrowForwardIcon } from '@reference-ui/lib'
import { splitLinkHash } from './linkHash'

/**
 * A grid of ghost link cards for "next steps" blocks at the end of a page.
 * Each card is one docs page: a title and a short plain description, the
 * whole card clickable, sized and hovered like the page's prev/next pager.
 * One column on narrow screens, two from 640px.
 */

// Literal values throughout: the build-time extractor does not follow spreads
// of shared style objects into nested selectors.
const grid = css({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: '3r',
  marginBottom: '8r',
  r: { 640: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' } },
})

const card = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1r',
  padding: '4r',
  borderRadius: 'md',
  color: 'docsText',
  textDecoration: 'none',
  transition: 'background 0.15s ease',
  _hover: { background: 'docsPanelBg' },
  _focusVisible: { outline: '2px solid', outlineColor: 'docsRing', outlineOffset: '2px' },
  '&:hover [data-card-arrow]': { color: 'docsText', transform: 'translateX(2px)' },
})

const title = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '2r',
  fontSize: '0.9375rem',
  fontWeight: '600',
})

const arrow = css({
  display: 'inline-flex',
  color: 'docsMuted',
  transition: 'color 0.15s ease, transform 0.15s ease',
})

const description = css({
  color: 'docsMuted',
  fontSize: '0.875rem',
  lineHeight: '1.5',
})

export function LinkCards({ children }: { children: ReactNode }) {
  return <Div className={grid}>{children}</Div>
}

interface LinkCardProps {
  /** A docs page path, such as `/global-css`, optionally with a `#section` hash. */
  href: string
  title: string
  children: ReactNode
}

export function LinkCard({ href, title: label, children }: LinkCardProps) {
  const { path, hash } = splitLinkHash(href)
  return (
    <Link to="/$slug" params={{ slug: path.replace(/^\//, '') }} hash={hash} className={card}>
      <span className={title}>
        {label}
        <span data-card-arrow className={arrow}>
          <ArrowForwardIcon size="sm" />
        </span>
      </span>
      <span className={description}>{children}</span>
    </Link>
  )
}
