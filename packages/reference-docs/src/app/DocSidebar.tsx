// Full-height docs navigation rail.
// It takes nothing and emits the wordmark plus the shared DocNav tree (section, then
// optional group heading, then pages), which the mobile nav reuses. Hidden on small
// viewports by container query.
import { Link, useRouterState } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { Aside, Div, Nav, css } from '@reference-ui/react'
import { type DocMeta, type NavSection, navSections } from '../collections/runtime'
import { Brand } from './Brand'

/**
 * Full-height navigation rail: brand header pinned at the top, then section
 * navigation in the scrolling remainder. Groups nest under a quiet heading with
 * a hairline down their pages. Hidden below the desktop breakpoint;
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
  _focusVisible: {
    outline: '2px solid',
    outlineColor: 'docsRing',
    outlineOffset: '2px',
  },
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
  const isActive = slug === 'initialize' ? pathname === '/' : pathname === `/${slug}`
  const className = [navLinkBase, isActive ? navLinkActive : navLinkIdle].join(' ')
  const ref = useRef<HTMLAnchorElement>(null)

  // A long rail hides deep pages; bring the current one into view without jumping.
  useEffect(() => {
    if (isActive) ref.current?.scrollIntoView({ block: 'nearest' })
  }, [isActive])

  return (
    <Link
      ref={ref}
      to={slug === 'initialize' ? '/' : '/$slug'}
      params={slug === 'initialize' ? undefined : { slug }}
      className={className}
      onClick={onNavigate}
    >
      {title}
    </Link>
  )
}

const groupLabel = css({
  fontSize: '0.8125rem',
  fontWeight: '500',
  lineHeight: '1.4',
  color: 'docsText',
  padding: '2r 3r',
})

const groupItems = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5r',
  marginLeft: '3r',
  paddingLeft: '2r',
  borderLeft: '1px solid',
  borderLeftColor: 'docsBorder',
})

type OnNavigate = (() => void) | undefined

function NavLinks({ items, onNavigate }: { items: DocMeta[]; onNavigate: OnNavigate }) {
  return items.map(({ slug, title }) => (
    <NavDocLink key={slug} slug={slug} title={title} onNavigate={onNavigate} />
  ))
}

function NavSectionBlock({ section, onNavigate }: { section: NavSection; onNavigate: OnNavigate }) {
  return (
    <Div display="flex" flexDirection="column">
      <Div className={sectionLabel}>{section.name}</Div>
      <Div display="flex" flexDirection="column" gap="0.5r">
        <NavLinks items={section.items} onNavigate={onNavigate} />
        {section.groups.map(group => (
          <Div key={group.name} display="flex" flexDirection="column" marginTop="2r">
            <Div className={groupLabel}>{group.name}</Div>
            <Div className={groupItems}>
              <NavLinks items={group.items} onNavigate={onNavigate} />
            </Div>
          </Div>
        ))}
      </Div>
    </Div>
  )
}

export function DocNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Nav display="flex" flexDirection="column" gap="7r">
      {navSections.map(section => (
        <NavSectionBlock key={section.name} section={section} onNavigate={onNavigate} />
      ))}
    </Nav>
  )
}

export function DocSidebar() {
  return (
    <Aside
      width="288px"
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
