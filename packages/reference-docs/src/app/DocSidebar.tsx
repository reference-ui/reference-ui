import { Link, useRouterState } from '@tanstack/react-router'
import { Aside, Div, H2, Nav, css } from '@reference-ui/react'
import { docsBySection } from '../collections/runtime'
import { ThemeToggle } from './ThemeToggle'

const navLinkClass = css({
  display: 'block',
  padding: '0.375rem 0',
  fontSize: '0.875rem',
  textDecoration: 'none',
  color: 'docsText',
})

const navLinkActiveClass = css({
  color: 'docsAccent',
  fontWeight: '600',
})

function NavDocLink({ slug, title }: { slug: string; title: string }) {
  const pathname = useRouterState({ select: s => s.location.pathname })
  const isActive = slug === 'intro' ? pathname === '/' : pathname === `/${slug}`
  const className = [navLinkClass, isActive ? navLinkActiveClass : ''].filter(Boolean).join(' ')

  return (
    <Link
      to={slug === 'intro' ? '/' : '/$slug'}
      params={slug === 'intro' ? undefined : { slug }}
      className={className}
    >
      {title}
    </Link>
  )
}

export function DocSidebar() {
  return (
    <Aside
      width="240px"
      flexShrink="0"
      position="sticky"
      top="0"
      height="100vh"
      overflowY="auto"
      padding="4r"
      borderRight="1px solid"
      borderRightColor="docsSidebarBorder"
      background="docsSidebarBg"
    >
      <H2 margin="0 0 1rem" fontSize="6r" fontWeight="600" color="docsText">
        Reference UI
      </H2>
      <Nav>
        {Object.entries(docsBySection).map(([section, items]) => (
          <Div key={section}>
            <Div
              fontSize="0.6875rem"
              fontWeight="600"
              textTransform="uppercase"
              letterSpacing="0.05em"
              color="docsNavHeading"
              marginTop="1rem"
              marginBottom="0.5rem"
            >
              {section}
            </Div>
            {items.map(({ slug, title }) => (
              <NavDocLink key={slug} slug={slug} title={title} />
            ))}
          </Div>
        ))}
      </Nav>
      <ThemeToggle />
    </Aside>
  )
}
