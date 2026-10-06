import { Outlet } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { MDXProvider } from '@mdx-js/react'
import { Div, Main } from '@reference-ui/react'
import { useDocsTheme } from '../shared/providers/DocsThemeContext'
import { mdxComponents } from '../mdx/components'
import { DocHeader } from './DocHeader'
import { DocMobileNav } from './DocMobileNav'
import { DocPageNav } from './DocPageNav'
import { DocSidebar } from './DocSidebar'

/**
 * App shell: a full-height sidebar rail on the left that owns navigation and
 * the wordmark. The content column has no bar — a floating `DocHeader` hovers
 * over the scrolling article. Everything sits on one background, split only by
 * the sidebar hairline.
 */
export function DocLayout() {
  const { colorMode } = useDocsTheme()
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    if (!navOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navOpen])

  return (
    <Div
      container
      colorMode={colorMode}
      display="flex"
      height="100dvh"
      overflow="hidden"
      bg="docsPageBg"
      color="docsText"
    >
      <DocSidebar />

      <Div position="relative" display="flex" flexDirection="column" flex="1" minWidth="0" minHeight="0">
        <DocHeader onOpenNav={() => setNavOpen(true)} />
        <Main flex="1" minHeight="0" overflowY="auto">
          <Div
            maxWidth="48rem"
            marginX="auto"
            paddingX="6r"
            paddingTop="18r"
            paddingBottom="10r"
            r={{
              640: { paddingX: '10r' },
              768: { paddingTop: '14r', paddingBottom: '14r' },
            }}
          >
            <MDXProvider components={mdxComponents}>
              <Outlet />
            </MDXProvider>
            <DocPageNav />
          </Div>
        </Main>
      </Div>

      <DocMobileNav open={navOpen} onClose={() => setNavOpen(false)} />
    </Div>
  )
}
