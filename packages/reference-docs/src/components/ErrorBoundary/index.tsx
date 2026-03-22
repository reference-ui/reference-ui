import React from 'react'
import { Div, H2, P, Pre } from '@reference-ui/react'
import { useDocsTheme } from '../../context/DocsThemeContext'

type Props = { children: React.ReactNode }
type State = { error: Error | null }

function ErrorDisplay({ error }: { error: Error }) {
  const { colorMode } = useDocsTheme()
  const themeAttr = colorMode === 'dark' ? 'dark' : undefined

  return (
    <Div
      colorMode={themeAttr}
      padding="2rem"
      fontFamily="mono"
      whiteSpace="pre-wrap"
      bg="docsPageBg"
      color="docsText"
      minHeight="100vh"
    >
      <H2 color="docsText">Error</H2>
      <P color="docsMuted">{error.message}</P>
      <Pre color="docsMuted">{error.stack}</Pre>
    </Div>
  )
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return <ErrorDisplay error={this.state.error} />
    }
    return this.props.children
  }
}
