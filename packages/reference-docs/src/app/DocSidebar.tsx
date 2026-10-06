import { Link, useRouterState } from '@tanstack/react-router'
import { Aside, Div, Nav, css } from '@reference-ui/react'
import { docsBySection } from '../collections/runtime'
import { Brand } from './Brand'

/**
 * Full-height navigation rail: brand header pinned at the top, then section
 * navigation in the scrolling remainder. Hidden below the desktop breakpoint;
 * the drawer reuses `DocNav`.
 */

const navLinkBase = css({
  display: 'flex',
  alignItems: 'center',
  padding: '2r 3r',
  borderRadius: 'md',
  fontSize: '0.875rem',
  lineHeight: '1.4',
  textDecoration: 'none',
  transition: 'color 0.15s ease',
})

const navLinkIdle = css({
  color: 'docsMuted',
  _hover: {
    color: 'docsText',
  },
})

const navLinkActive = css({
  background: 'docsActiveBg',
  color: 'docsText',
  _hover: {
    color: 'docsText',
  },
})

const sectionLabel = css({
  fontSize: '0.6875rem',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'docsNavHeading',
  paddingX: '3r',
  marginBottom: '2r',
})

function NavDocLink({
  slug,
  title,
  onNavigate,
}: {
  slug: string
  title: string
  onNavigate?: () => void
}) {
  const pathname = useRouterState({ select: s => s.location.pathname })
  const isActive = slug === 'intro' ? pathname === '/' : pathname === `/${slug}`
  const className = [navLinkBase, isActive ? navLinkActive : navLinkIdle].join(' ')

  return (
    <Link
      to={slug === 'intro' ? '/' : '/$slug'}
      params={slug === 'intro' ? undefined : { slug }}
      className={className}
      onClick={onNavigate}
    >
      {title}
    </Link>
  )
}

export function DocNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Nav display="flex" flexDirection="column" gap="7r">
      {Object.entries(docsBySection).map(([section, items]) => (
        <Div key={section} display="flex" flexDirection="column">
          <Div className={sectionLabel}>{section}</Div>
          <Div display="flex" flexDirection="column" gap="0.5r">
            {items.map(({ slug, title }) => (
              <NavDocLink key={slug} slug={slug} title={title} onNavigate={onNavigate} />
            ))}
          </Div>
        </Div>
      ))}
    </Nav>
  )
}

export function DocSidebar() {
  return (
    <Aside
      width="260px"
      flexShrink="0"
      display="none"
      height="100%"
      flexDirection="column"
      borderRight="1px solid"
      borderRightColor="docsBorder"
      r={{ 768: { display: 'flex' } }}
    >
      <Div display="flex" alignItems="center" flexShrink="0" paddingX="7r" paddingY="6r">
        <Brand />
      </Div>
      <Div flex="1" overflowY="auto" paddingX="4r" paddingBottom="6r">
        <DocNav />
      </Div>
    </Aside>
  )
}
