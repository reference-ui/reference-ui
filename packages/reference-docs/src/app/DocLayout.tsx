import { Outlet } from '@tanstack/react-router'
import { MDXProvider } from '@mdx-js/react'
import { Div, Main } from '@reference-ui/react'
import { useDocsTheme } from '../shared/providers/DocsThemeContext'
import { mdxComponents } from '../mdx/components'
import { DocSidebar } from './DocSidebar'

export function DocLayout() {
  const { colorMode } = useDocsTheme()

  return (
    <Div colorMode={colorMode} display="flex" minHeight="100vh" bg="docsPageBg" color="docsText">
      <DocSidebar />
      <Main flex="1" minWidth="0">
        <Div maxWidth="90ex" marginX="auto" padding="10r" minWidth="0">
          <MDXProvider components={mdxComponents}>
            <Outlet />
          </MDXProvider>
        </Div>
      </Main>
    </Div>
  )
}
