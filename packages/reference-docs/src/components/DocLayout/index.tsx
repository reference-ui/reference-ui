import { Outlet } from '@tanstack/react-router'
import { MDXProvider } from '@mdx-js/react'
import { Div, Main } from '@reference-ui/react'
import { useDocsTheme } from '../../context/DocsThemeContext'
import { mdxComponents } from '../mdxComponents'
import { DocSidebar } from './DocSidebar'

export function DocLayout() {
  const { colorMode } = useDocsTheme()
  const themeAttr = colorMode === 'dark' ? 'dark' : undefined

  return (
    <Div
      colorMode={themeAttr}
      w="100%"
      minHeight="100vh"
      bg="docsPageBg"
      color="docsText"
      display="grid"
      gridTemplateColumns="1fr minmax(0, 90ex) 1fr"
    >
      <Div minHeight="100vh" display="flex" justifyContent="flex-end">
        <DocSidebar />
      </Div>
      <Main minHeight="100vh" minWidth="0" overflow="auto">
        <Div padding="10r" minWidth="0" w="100%">
          <MDXProvider components={mdxComponents}>
            <Outlet />
          </MDXProvider>
        </Div>
      </Main>
      <Div minHeight="100vh" />
    </Div>
  )
}
